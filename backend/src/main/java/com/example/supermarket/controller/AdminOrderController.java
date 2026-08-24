package com.example.supermarket.controller;

import com.example.supermarket.dto.AdminOrderDetailsDto;
import com.example.supermarket.dto.AdminOrderSummaryDto;
import com.example.supermarket.dto.DeliveryDto;
import com.example.supermarket.dto.OrderItemDto;
import com.example.supermarket.model.Order;
import com.example.supermarket.model.Payment;
import com.example.supermarket.model.ReservationStatus;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import com.example.supermarket.service.DeliveryService;
import com.example.supermarket.service.InventoryReservationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final DeliveryService deliveryService;
    private final InventoryReservationService inventoryReservationService;
    private final com.example.supermarket.service.NotificationService notificationService;

    public AdminOrderController(OrderRepository orderRepository,
                                PaymentRepository paymentRepository,
                                DeliveryService deliveryService,
                                InventoryReservationService inventoryReservationService,
                                com.example.supermarket.service.NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.deliveryService = deliveryService;
        this.inventoryReservationService = inventoryReservationService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Page<AdminOrderSummaryDto>> getOrders(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "search", required = false) String search) {

        if (size > 50) size = 50;

        Pageable pageable = PageRequest.of(page, size);
        Page<Order> ordersPage = orderRepository.searchOrders(
                status != null && !status.trim().isEmpty() ? status : null,
                search != null && !search.trim().isEmpty() ? search : null,
                pageable);

        Page<AdminOrderSummaryDto> summaryPage = ordersPage.map(order -> {
            String paymentStatus = null;
            Optional<Payment> payment = paymentRepository.findByOrderNumber(order.getOrderNumber());
            if (payment.isPresent()) {
                paymentStatus = payment.get().getStatus().name();
            }

            String deliveryStatus = null;
            if ("CONFIRMED".equals(order.getStatus())) {
                try {
                    deliveryStatus = deliveryService.getDeliveryForOrder(order.getOrderNumber(), order.getCustomerId(), order)
                            .map(d -> d.getStatus().name())
                            .orElse(null);
                } catch (Exception e) {}
            }

            return new AdminOrderSummaryDto(
                    order.getOrderNumber(),
                    order.getCustomerId(),
                    order.getStatus(),
                    order.getTotal(),
                    order.getCreatedAt(),
                    paymentStatus,
                    deliveryStatus
            );
        });

        return ResponseEntity.ok(summaryPage);
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<AdminOrderDetailsDto> getOrderDetails(@PathVariable("orderNumber") String orderNumber) {
        Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();

        Payment payment = paymentRepository.findByOrderNumber(orderNumber).orElse(null);
        String paymentMethod = payment != null ? (payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : null) : null;
        String paymentStatus = payment != null ? (payment.getStatus() != null ? payment.getStatus().name() : null) : null;
        String providerPaymentId = payment != null ? payment.getProviderPaymentId() : null;

        DeliveryDto deliveryDto = null;
        if ("CONFIRMED".equals(order.getStatus()) || "DELIVERED".equals(order.getStatus())) {
            try {
                deliveryDto = deliveryService.getDeliveryForOrder(order.getOrderNumber(), order.getCustomerId(), order)
                        .map(d -> new DeliveryDto(d.getOrderNumber(), d.getProvider(), d.getStatus(), d.getTrackingUrl(), d.getEstimatedDeliveryTime(), d.getUpdatedAt()))
                        .orElse(null);
            } catch (Exception e) {}
        }

        List<OrderItemDto> items = order.getItems().stream().map(item -> new OrderItemDto(
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getUnitPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity()))
        )).toList();

        AdminOrderDetailsDto dto = new AdminOrderDetailsDto(
                order.getOrderNumber(),
                order.getCustomerId(),
                order.getStatus(),
                order.getSubtotal(),
                order.getTax(),
                order.getDiscount(),
                order.getTotal(),
                order.getCouponCode(),
                order.getCreatedAt(),
                paymentMethod,
                paymentStatus,
                providerPaymentId,
                deliveryDto,
                items
        );

        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/{orderNumber}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable("orderNumber") String orderNumber) {
        Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();

        if ("CANCELLED".equals(order.getStatus())) {
            // Idempotent
            return ResponseEntity.ok(order);
        }

        if (!"PENDING_PAYMENT".equals(order.getStatus()) && !"CONFIRMED".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body("Cannot cancel order in status: " + order.getStatus());
        }

        String originalStatus = order.getStatus();
        order.setStatus("CANCELLED");
        order = orderRepository.save(order);
        
        notificationService.createNotification(
            order.getCustomerId(),
            com.example.supermarket.model.NotificationType.ORDER_CANCELLED,
            "Order Cancelled",
            "Your order " + order.getOrderNumber() + " was cancelled by customer support.",
            order.getOrderNumber()
        );

        if ("PENDING_PAYMENT".equals(originalStatus)) {
            inventoryReservationService.releaseReservations(orderNumber, ReservationStatus.RELEASED);
        } else if ("CONFIRMED".equals(originalStatus)) {
            inventoryReservationService.releaseReservations(orderNumber, ReservationStatus.RELEASED);
            try {
                deliveryService.cancelDelivery(orderNumber);
            } catch (Exception e) {
                // Ignore delivery cancellation failure if it's already cancelled or not found
            }
        }

        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{orderNumber}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable("orderNumber") String orderNumber, 
            @RequestParam("status") String status) {
        
        Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();
        String currentStatus = order.getStatus();
        String newStatus = status.toUpperCase();

        if ("PENDING_PAYMENT".equals(currentStatus) || "CANCELLED".equals(currentStatus)) {
            return ResponseEntity.badRequest().body("Cannot bypass payment or revive cancelled orders.");
        }

        if (!List.of("CONFIRMED", "SHIPPED", "DELIVERED").contains(newStatus)) {
            return ResponseEntity.badRequest().body("Invalid target status.");
        }

        order.setStatus(newStatus);
        order = orderRepository.save(order);

        // If the order gets marked as CONFIRMED, create the delivery mock
        if ("CONFIRMED".equals(order.getStatus())) {
            try {
                deliveryService.createDeliveryForOrder(order);
            } catch (Exception e) {}
        }

        return ResponseEntity.ok(order);
    }
}
