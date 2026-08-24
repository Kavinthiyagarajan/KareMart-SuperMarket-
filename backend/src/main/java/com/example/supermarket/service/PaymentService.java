package com.example.supermarket.service;

import com.example.supermarket.dto.PaymentCreationRequest;
import com.example.supermarket.model.Order;
import com.example.supermarket.model.Payment;
import com.example.supermarket.model.PaymentMethod;
import com.example.supermarket.model.PaymentStatus;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentProvider activeProvider;
    private final InventoryReservationService inventoryReservationService;
    private final DeliveryService deliveryService;
    private final NotificationService notificationService;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository, 
                          java.util.List<PaymentProvider> paymentProviders, 
                          InventoryReservationService inventoryReservationService,
                          DeliveryService deliveryService,
                          NotificationService notificationService,
                          @org.springframework.beans.factory.annotation.Value("${payment.provider:mock}") String providerName) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.inventoryReservationService = inventoryReservationService;
        this.deliveryService = deliveryService;
        this.notificationService = notificationService;
        this.activeProvider = paymentProviders.stream()
                .filter(p -> p.getProviderId().equalsIgnoreCase(providerName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Payment provider not found: " + providerName));
    }

    public String getActiveProviderId() {
        return activeProvider.getProviderId();
    }

    @Transactional
    public Payment createPayment(PaymentCreationRequest request, String customerId) {
        // Idempotency check
        Optional<Payment> existingPayment = paymentRepository.findByIdempotencyKey(request.idempotencyKey());
        if (existingPayment.isPresent()) {
            Payment p = existingPayment.get();
            if (!p.getCustomerId().equals(customerId)) {
                throw new RuntimeException("Unauthorized payment access");
            }
            return p;
        }

        Order order = orderRepository.findByOrderNumber(request.orderNumber())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized order access");
        }

        if (!"PENDING_PAYMENT".equals(order.getStatus())) {
            throw new RuntimeException("Order is not in PENDING_PAYMENT status");
        }

        Payment payment = new Payment();
        payment.setOrderNumber(order.getOrderNumber());
        payment.setCustomerId(customerId);
        payment.setAmount(order.getTotal());
        payment.setCurrency("INR");
        payment.setPaymentMethod(request.paymentMethod());
        payment.setIdempotencyKey(request.idempotencyKey());

        if (request.paymentMethod() == PaymentMethod.COD) {
            payment.setProvider(PaymentMethod.COD);
            payment.setStatus(PaymentStatus.SUCCESS);
            payment = paymentRepository.save(payment);
            
            notificationService.createNotification(customerId, com.example.supermarket.model.NotificationType.PAYMENT_SUCCESS, "Payment Processed", "Your COD order of ₹" + payment.getAmount() + " was processed.", payment.getOrderNumber());
            
            order.setStatus("CONFIRMED");
            orderRepository.save(order);
            
            notificationService.createNotification(customerId, com.example.supermarket.model.NotificationType.ORDER_CONFIRMED, "Order Confirmed", "Your order " + order.getOrderNumber() + " has been confirmed.", order.getOrderNumber());
            
            inventoryReservationService.commitReservations(order.getOrderNumber());
            deliveryService.createDeliveryForOrder(order);
            
            return payment;
        } else {
            payment.setProvider("razorpay".equalsIgnoreCase(activeProvider.getProviderId()) ? PaymentMethod.RAZORPAY : PaymentMethod.MOCK);
            payment.setStatus(PaymentStatus.CREATED);
            payment = activeProvider.createPayment(order, payment);
            return paymentRepository.save(payment);
        }
    }

    @Transactional
    public Payment verifyPayment(Long paymentId, Map<String, String> verificationData, String customerId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (!payment.getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized payment access");
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getStatus() == PaymentStatus.FAILED) {
            return payment; // Already processed
        }

        boolean success = activeProvider.verifyPayment(payment, verificationData);

        if (success) {
            payment.setStatus(PaymentStatus.SUCCESS);
            notificationService.createNotification(customerId, com.example.supermarket.model.NotificationType.PAYMENT_SUCCESS, "Payment Successful", "Your payment of ₹" + payment.getAmount() + " was successful.", payment.getOrderNumber());
            
            Order order = orderRepository.findByOrderNumber(payment.getOrderNumber()).orElseThrow();
            order.setStatus("CONFIRMED");
            orderRepository.save(order);
            notificationService.createNotification(customerId, com.example.supermarket.model.NotificationType.ORDER_CONFIRMED, "Order Confirmed", "Your order " + order.getOrderNumber() + " has been confirmed.", order.getOrderNumber());
            
            inventoryReservationService.commitReservations(order.getOrderNumber());
            deliveryService.createDeliveryForOrder(order);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            notificationService.createNotification(customerId, com.example.supermarket.model.NotificationType.PAYMENT_FAILED, "Payment Failed", "Your payment of ₹" + payment.getAmount() + " failed.", payment.getOrderNumber());
            
            Order order = orderRepository.findByOrderNumber(payment.getOrderNumber()).orElseThrow();
            order.setStatus("CANCELLED");
            orderRepository.save(order);
            notificationService.createNotification(customerId, com.example.supermarket.model.NotificationType.ORDER_CANCELLED, "Order Cancelled", "Your order " + order.getOrderNumber() + " was cancelled due to payment failure.", order.getOrderNumber());
            
            inventoryReservationService.releaseReservations(order.getOrderNumber(), com.example.supermarket.model.ReservationStatus.RELEASED);
        }

        return paymentRepository.save(payment);
    }
}
