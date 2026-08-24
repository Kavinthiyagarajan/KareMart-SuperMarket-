package com.example.supermarket.controller;

import com.example.supermarket.model.Order;
import com.example.supermarket.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {
    private final OrderRepository orderRepository;
    private final com.example.supermarket.repository.PaymentRepository paymentRepository;
    private final com.example.supermarket.service.DeliveryService deliveryService;
    private final com.example.supermarket.repository.OrderItemRepository orderItemRepository;
    private final com.example.supermarket.repository.ProductRepository productRepository;

    public ProfileController(OrderRepository orderRepository,
                             com.example.supermarket.repository.PaymentRepository paymentRepository,
                             com.example.supermarket.service.DeliveryService deliveryService,
                             com.example.supermarket.repository.OrderItemRepository orderItemRepository,
                             com.example.supermarket.repository.ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.deliveryService = deliveryService;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/buy-again")
    public ResponseEntity<List<com.example.supermarket.model.Product>> getBuyAgain(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        List<Long> productIds = orderItemRepository.findProductIdsByCustomerIdAndStatuses(
            principal.getName(), List.of("CONFIRMED", "DELIVERED")
        );
        if (productIds.isEmpty()) return ResponseEntity.ok(List.of());
        
        List<com.example.supermarket.model.Product> products = productRepository.findByIdIn(productIds);
        
        // Sort according to original IDs
        java.util.Map<Long, com.example.supermarket.model.Product> productMap = new java.util.HashMap<>();
        for (com.example.supermarket.model.Product p : products) productMap.put(p.getId(), p);
        
        List<com.example.supermarket.model.Product> sortedProducts = new java.util.ArrayList<>();
        for (Long id : productIds) {
            com.example.supermarket.model.Product p = productMap.get(id);
            if (p != null && Boolean.TRUE.equals(p.getActive()) && "IN_STOCK".equals(p.getAvailabilityStatus())) {
                sortedProducts.add(p);
            }
        }
        
        return ResponseEntity.ok(sortedProducts);
    }

    @GetMapping("/orders")
    public ResponseEntity<org.springframework.data.domain.Page<com.example.supermarket.dto.OrderSummaryDto>> getMyOrders(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") int size,
            Principal principal) {
        
        if (principal == null) return ResponseEntity.status(401).build();
        if (size > 50) size = 50;

        String username = principal.getName();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Order> ordersPage = orderRepository.findByCustomerIdOrderByIdDesc(username, pageable);

        org.springframework.data.domain.Page<com.example.supermarket.dto.OrderSummaryDto> summaryPage = ordersPage.map(order -> {
            com.example.supermarket.dto.DeliveryDto deliveryDto = null;
            if ("CONFIRMED".equals(order.getStatus())) {
                try {
                    deliveryDto = deliveryService.getDeliveryForOrder(order.getOrderNumber(), username, order)
                        .map(d -> new com.example.supermarket.dto.DeliveryDto(d.getOrderNumber(), d.getProvider(), d.getStatus(), d.getTrackingUrl(), d.getEstimatedDeliveryTime(), d.getUpdatedAt()))
                        .orElse(null);
                } catch (Exception e) {}
            }
            return new com.example.supermarket.dto.OrderSummaryDto(
                order.getOrderNumber(),
                order.getStatus(),
                order.getTotal(),
                order.getCreatedAt(),
                deliveryDto
            );
        });

        return ResponseEntity.ok(summaryPage);
    }

    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<com.example.supermarket.dto.OrderDetailsDto> getOrderDetails(@org.springframework.web.bind.annotation.PathVariable String orderNumber, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();

        Order order = orderRepository.findByOrderNumber(orderNumber).orElse(null);
        if (order == null || !order.getCustomerId().equals(principal.getName())) {
            return ResponseEntity.status(403).build();
        }

        com.example.supermarket.model.Payment payment = paymentRepository.findByOrderNumber(orderNumber).orElse(null);
        String paymentMethod = payment != null ? (payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : null) : null;
        String paymentStatus = payment != null ? (payment.getStatus() != null ? payment.getStatus().name() : null) : null;

        com.example.supermarket.dto.DeliveryDto deliveryDto = null;
        if ("CONFIRMED".equals(order.getStatus())) {
            try {
                deliveryDto = deliveryService.getDeliveryForOrder(order.getOrderNumber(), principal.getName(), order)
                    .map(d -> new com.example.supermarket.dto.DeliveryDto(d.getOrderNumber(), d.getProvider(), d.getStatus(), d.getTrackingUrl(), d.getEstimatedDeliveryTime(), d.getUpdatedAt()))
                    .orElse(null);
            } catch (Exception e) {}
        }

        List<com.example.supermarket.dto.OrderItemDto> items = order.getItems().stream().map(item -> new com.example.supermarket.dto.OrderItemDto(
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getUnitPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity()))
        )).toList();

        com.example.supermarket.dto.OrderDetailsDto dto = new com.example.supermarket.dto.OrderDetailsDto(
                order.getOrderNumber(),
                order.getStatus(),
                order.getSubtotal(),
                order.getTax(),
                order.getDiscount(),
                order.getTotal(),
                order.getCouponCode(),
                order.getCreatedAt(),
                paymentMethod,
                paymentStatus,
                deliveryDto,
                items
        );

        return ResponseEntity.ok(dto);
    }
}
