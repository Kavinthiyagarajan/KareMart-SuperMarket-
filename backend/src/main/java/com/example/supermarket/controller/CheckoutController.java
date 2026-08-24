package com.example.supermarket.controller;

import com.example.supermarket.dto.CheckoutRequest;
import com.example.supermarket.dto.CheckoutResponse;
import com.example.supermarket.model.Order;
import com.example.supermarket.service.CheckoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/checkout")
public class CheckoutController {
    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/validate")
    public ResponseEntity<CheckoutResponse> validateCheckout(@jakarta.validation.Valid @RequestBody CheckoutRequest request, java.security.Principal principal) {
        String username = principal != null ? principal.getName() : null;
        CheckoutResponse response = checkoutService.validateCheckout(request, username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/place-order")
    public ResponseEntity<?> placeOrder(@jakarta.validation.Valid @RequestBody CheckoutRequest request, java.security.Principal principal) {
        try {
            String username = principal != null ? principal.getName() : "GUEST";
            Order order = checkoutService.placeOrder(request, username);
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
