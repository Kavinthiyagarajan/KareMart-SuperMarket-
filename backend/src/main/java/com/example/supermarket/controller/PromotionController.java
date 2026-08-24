package com.example.supermarket.controller;

import com.example.supermarket.dto.CouponValidationResult;
import com.example.supermarket.service.PromotionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @PostMapping("/validate")
    public ResponseEntity<CouponValidationResult> validateCoupon(
            @RequestBody Map<String, Object> request,
            Principal principal) {
        
        String code = (String) request.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().build();
        }

        BigDecimal subtotal;
        try {
            subtotal = new BigDecimal(request.get("subtotal").toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        String username = principal != null ? principal.getName() : "GUEST";
        CouponValidationResult result = promotionService.validateCoupon(code, subtotal, username);
        
        return ResponseEntity.ok(result);
    }
}
