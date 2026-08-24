package com.example.supermarket.service;

import com.example.supermarket.model.Order;
import com.example.supermarket.model.ReservationStatus;
import com.example.supermarket.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Service
public class OrderExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(OrderExpirationJob.class);

    private final OrderRepository orderRepository;
    private final InventoryReservationService inventoryReservationService;
    private final NotificationService notificationService;

    @Value("${order.payment-expiration-minutes:15}")
    private int expirationMinutes;

    public OrderExpirationJob(OrderRepository orderRepository, InventoryReservationService inventoryReservationService, NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.inventoryReservationService = inventoryReservationService;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedDelay = 60000) // Runs every minute
    public void expirePendingOrders() {
        ZonedDateTime cutoff = ZonedDateTime.now().minusMinutes(expirationMinutes);
        List<Order> expiredOrders = orderRepository.findByStatusAndCreatedAtBefore("PENDING_PAYMENT", cutoff);

        for (Order order : expiredOrders) {
            try {
                expireOrder(order.getOrderNumber());
            } catch (Exception e) {
                log.error("Failed to expire order {}", order.getOrderNumber(), e);
            }
        }
    }

    @Transactional
    public void expireOrder(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber).orElseThrow();
        if (!"PENDING_PAYMENT".equals(order.getStatus())) {
            return; // Already processed
        }

        log.info("Expiring order {} due to payment timeout", orderNumber);
        order.setStatus("CANCELLED");
        orderRepository.save(order);
        
        notificationService.createNotification(
            order.getCustomerId(),
            com.example.supermarket.model.NotificationType.ORDER_CANCELLED,
            "Order Cancelled",
            "Your order " + order.getOrderNumber() + " was cancelled due to payment timeout.",
            order.getOrderNumber()
        );

        inventoryReservationService.releaseReservations(orderNumber, ReservationStatus.EXPIRED);
    }
}
