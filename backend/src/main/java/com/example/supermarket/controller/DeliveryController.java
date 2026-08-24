package com.example.supermarket.controller;

import com.example.supermarket.dto.DeliveryDto;
import com.example.supermarket.model.Delivery;
import com.example.supermarket.model.Order;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.service.DeliveryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/orders/{orderNumber}/delivery")
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final OrderRepository orderRepository;

    public DeliveryController(DeliveryService deliveryService, OrderRepository orderRepository) {
        this.deliveryService = deliveryService;
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public ResponseEntity<DeliveryDto> getDelivery(@PathVariable String orderNumber, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();

        Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();
        try {
            Optional<Delivery> deliveryOpt = deliveryService.getDeliveryForOrder(orderNumber, principal.getName(), order);
            if (deliveryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // We automatically advance status for the mock provider if this endpoint is hit, simulating background updates
            // (Only for mock purposes based on project constraints without background jobs)
            Delivery delivery = deliveryService.updateDeliveryStatus(orderNumber);

            DeliveryDto dto = new DeliveryDto(
                delivery.getOrderNumber(),
                delivery.getProvider(),
                delivery.getStatus(),
                delivery.getTrackingUrl(),
                delivery.getEstimatedDeliveryTime(),
                delivery.getUpdatedAt()
            );

            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build(); // Unauthorized access
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<Void> cancelDelivery(@PathVariable String orderNumber, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();

        Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
        if (orderOpt.isEmpty() || !orderOpt.get().getCustomerId().equals(principal.getName())) {
            return ResponseEntity.status(403).build();
        }

        try {
            deliveryService.cancelDelivery(orderNumber);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
