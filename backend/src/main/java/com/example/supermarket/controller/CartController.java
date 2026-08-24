package com.example.supermarket.controller;

import com.example.supermarket.dto.CartResponseDto;
import com.example.supermarket.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<?> getCart(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Authentication required");
        return ResponseEntity.ok(cartService.getCart(principal.getName()));
    }

    @PostMapping("/items")
    public ResponseEntity<?> addItem(@RequestParam Long productId, @RequestParam int quantity, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Authentication required");
        try {
            return ResponseEntity.ok(cartService.addItem(principal.getName(), productId, quantity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<?> updateQuantity(@PathVariable Long productId, @RequestParam int quantity, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Authentication required");
        try {
            return ResponseEntity.ok(cartService.updateQuantity(principal.getName(), productId, quantity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<?> removeItem(@PathVariable Long productId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Authentication required");
        return ResponseEntity.ok(cartService.removeItem(principal.getName(), productId));
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Authentication required");
        cartService.clearCart(principal.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder/{orderNumber}")
    public ResponseEntity<?> reorder(@PathVariable String orderNumber, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Authentication required");
        try {
            return ResponseEntity.ok(cartService.reorder(principal.getName(), orderNumber));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
