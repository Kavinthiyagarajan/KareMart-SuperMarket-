package com.example.supermarket.controller;

import com.example.supermarket.dto.PaymentCreationRequest;
import com.example.supermarket.model.Payment;
import com.example.supermarket.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService paymentService;

    @org.springframework.beans.factory.annotation.Value("${razorpay.key-id:}")
    private String razorpayKeyId;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        String activeProvider = paymentService.getActiveProviderId();
        return ResponseEntity.ok(Map.of(
            "provider", activeProvider,
            "razorpayKeyId", "razorpay".equalsIgnoreCase(activeProvider) ? razorpayKeyId : ""
        ));
    }

    @PostMapping("/create")
    public ResponseEntity<Payment> createPayment(@RequestBody PaymentCreationRequest request, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        try {
            Payment payment = paymentService.createPayment(request, principal.getName());
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<Payment> verifyPayment(@PathVariable Long id, @RequestBody Map<String, String> verificationData, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        try {
            Payment payment = paymentService.verifyPayment(id, verificationData, principal.getName());
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
