package com.example.supermarket.service;

import com.example.supermarket.dto.CancellationRequestDto;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.CancellationRequestRepository;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class CancellationService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final InventoryReservationService inventoryReservationService;
    private final DeliveryService deliveryService;
    private final NotificationService notificationService;

    public CancellationService(OrderRepository orderRepository,
                               PaymentRepository paymentRepository,
                               CancellationRequestRepository cancellationRequestRepository,
                               InventoryReservationService inventoryReservationService,
                               DeliveryService deliveryService,
                               NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.cancellationRequestRepository = cancellationRequestRepository;
        this.inventoryReservationService = inventoryReservationService;
        this.deliveryService = deliveryService;
        this.notificationService = notificationService;
    }

    @Transactional
    public CancellationRequestDto cancelOrder(String orderNumber, CancellationReason reason, String notes, String customerId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderNumber));

        if (!order.getCustomerId().equals(customerId)) {
            throw new SecurityException("Unauthorized access to order " + orderNumber);
        }

        if ("CANCELLED".equals(order.getStatus())) {
            Optional<CancellationRequest> existing = cancellationRequestRepository.findTopByOrderNumberOrderByCreatedAtDesc(orderNumber);
            if (existing.isPresent()) {
                return CancellationRequestDto.fromEntity(existing.get());
            }
            throw new IllegalStateException("Order is already cancelled.");
        }

        if ("DELIVERED".equals(order.getStatus())) {
            throw new IllegalStateException("Delivered orders cannot be cancelled. Please request a return instead.");
        }

        if (!"PENDING_PAYMENT".equals(order.getStatus()) && !"CONFIRMED".equals(order.getStatus()) && !"SHIPPED".equals(order.getStatus())) {
            throw new IllegalStateException("Cannot cancel order in status: " + order.getStatus());
        }

        String originalStatus = order.getStatus();
        order.setStatus("CANCELLED");
        orderRepository.save(order);

        // Release inventory reservations safely
        inventoryReservationService.releaseReservations(orderNumber, ReservationStatus.RELEASED);

        // Cancel delivery if it was scheduled
        if ("CONFIRMED".equals(originalStatus) || "SHIPPED".equals(originalStatus)) {
            try {
                deliveryService.cancelDelivery(orderNumber);
            } catch (Exception ignored) {}
        }

        // Determine refund tracking based on payment method and state
        Payment payment = paymentRepository.findByOrderNumber(orderNumber).orElse(null);
        RefundStatus refundStatus = RefundStatus.NOT_REQUESTED;
        BigDecimal refundAmount = BigDecimal.ZERO;

        if (payment != null && payment.getStatus() == PaymentStatus.SUCCESS && payment.getPaymentMethod() != PaymentMethod.COD) {
            refundStatus = RefundStatus.REQUESTED;
            refundAmount = order.getTotal();
        }

        CancellationRequest request = new CancellationRequest();
        request.setOrderNumber(orderNumber);
        request.setUserId(customerId);
        request.setReason(reason != null ? reason : CancellationReason.OTHER);
        request.setNotes(notes);
        request.setStatus(RequestStatus.COMPLETED);
        request.setRefundStatus(refundStatus);
        request.setRefundAmount(refundAmount);
        request = cancellationRequestRepository.save(request);

        // Emit notifications
        notificationService.createNotification(
                customerId,
                NotificationType.ORDER_CANCELLED,
                "Order Cancelled",
                "Your order " + orderNumber + " has been successfully cancelled.",
                orderNumber
        );

        if (refundStatus == RefundStatus.REQUESTED) {
            notificationService.createNotification(
                    customerId,
                    NotificationType.REFUND_REQUESTED,
                    "Refund Requested",
                    "A refund request of ₹" + refundAmount + " has been initiated for cancelled order " + orderNumber + ".",
                    orderNumber
            );
        }

        return CancellationRequestDto.fromEntity(request);
    }

    @Transactional(readOnly = true)
    public Page<CancellationRequestDto> getCancellationsForCustomer(String customerId, Pageable pageable) {
        return cancellationRequestRepository.findByUserIdOrderByCreatedAtDesc(customerId, pageable)
                .map(CancellationRequestDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public Optional<CancellationRequestDto> getCancellationForOrder(String orderNumber, String customerId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderNumber));

        if (!order.getCustomerId().equals(customerId)) {
            throw new SecurityException("Unauthorized access to order " + orderNumber);
        }

        return cancellationRequestRepository.findTopByOrderNumberOrderByCreatedAtDesc(orderNumber)
                .map(CancellationRequestDto::fromEntity);
    }
}
