package com.example.supermarket.service;

import com.example.supermarket.model.Delivery;
import com.example.supermarket.model.DeliveryStatus;
import com.example.supermarket.model.Order;
import com.example.supermarket.repository.DeliveryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryProvider activeProvider;
    private final NotificationService notificationService;
    private final com.example.supermarket.repository.OrderRepository orderRepository;

    public DeliveryService(DeliveryRepository deliveryRepository, 
                           List<DeliveryProvider> deliveryProviders,
                           NotificationService notificationService,
                           com.example.supermarket.repository.OrderRepository orderRepository,
                           @Value("${delivery.provider:mock}") String providerName) {
        this.deliveryRepository = deliveryRepository;
        this.notificationService = notificationService;
        this.orderRepository = orderRepository;
        this.activeProvider = deliveryProviders.stream()
                .filter(p -> p.getProviderId().equalsIgnoreCase(providerName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Delivery provider not found: " + providerName));
    }

    @Transactional
    public Delivery createDeliveryForOrder(Order order) {
        if (!"CONFIRMED".equals(order.getStatus())) {
            throw new RuntimeException("Cannot create delivery for order not in CONFIRMED state.");
        }

        // Idempotency check
        Optional<Delivery> existing = deliveryRepository.findByOrderNumber(order.getOrderNumber());
        if (existing.isPresent()) {
            return existing.get();
        }

        Delivery delivery = new Delivery();
        delivery.setOrderNumber(order.getOrderNumber());
        delivery.setProvider(activeProvider.getProviderId());
        
        delivery = activeProvider.createDelivery(order, delivery);
        delivery = deliveryRepository.save(delivery);
        
        notificationService.createNotification(
            order.getCustomerId(),
            com.example.supermarket.model.NotificationType.DELIVERY_CREATED,
            "Delivery Scheduled",
            "Your order " + order.getOrderNumber() + " has been scheduled for delivery.",
            order.getOrderNumber()
        );
        return delivery;
    }

    @Transactional(readOnly = true)
    public Optional<Delivery> getDeliveryForOrder(String orderNumber, String customerId, Order order) {
        if (!order.getCustomerId().equals(customerId) || !order.getOrderNumber().equals(orderNumber)) {
            throw new RuntimeException("Unauthorized access to delivery.");
        }
        return deliveryRepository.findByOrderNumber(orderNumber);
    }

    @Transactional
    public Delivery updateDeliveryStatus(String orderNumber) {
        Delivery delivery = deliveryRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Delivery not found for order: " + orderNumber));
        
        DeliveryStatus oldStatus = delivery.getStatus();
        delivery = activeProvider.updateDeliveryStatus(delivery);
        delivery = deliveryRepository.save(delivery);
        
        if (oldStatus != delivery.getStatus()) {
            Order order = orderRepository.findByOrderNumber(orderNumber).orElse(null);
            if (order != null) {
                if (delivery.getStatus() == DeliveryStatus.OUT_FOR_DELIVERY) {
                    notificationService.createNotification(
                        order.getCustomerId(),
                        com.example.supermarket.model.NotificationType.OUT_FOR_DELIVERY,
                        "Out for Delivery",
                        "Your order " + order.getOrderNumber() + " is out for delivery.",
                        order.getOrderNumber()
                    );
                } else if (delivery.getStatus() == DeliveryStatus.DELIVERED) {
                    notificationService.createNotification(
                        order.getCustomerId(),
                        com.example.supermarket.model.NotificationType.ORDER_DELIVERED,
                        "Order Delivered",
                        "Your order " + order.getOrderNumber() + " has been delivered successfully.",
                        order.getOrderNumber()
                    );
                }
            }
        }
        
        return delivery;
    }

    @Transactional
    public void cancelDelivery(String orderNumber) {
        Delivery delivery = deliveryRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Delivery not found for order: " + orderNumber));
        
        activeProvider.cancelDelivery(delivery);
        deliveryRepository.save(delivery);
    }
}
