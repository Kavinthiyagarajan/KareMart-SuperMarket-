package com.example.supermarket.controller;

import com.example.supermarket.dto.CouponCreateRequest;
import com.example.supermarket.dto.CouponUpdateRequest;
import com.example.supermarket.service.AdminCouponService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/coupons")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {

    private final AdminCouponService adminCouponService;

    public AdminCouponController(AdminCouponService adminCouponService) {
        this.adminCouponService = adminCouponService;
    }

    @GetMapping
    public ResponseEntity<?> listCoupons(
            @RequestParam(required = false) String code,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminCouponService.listCoupons(code, PageRequest.of(page, size, Sort.by("id").descending())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCoupon(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminCouponService.getCoupon(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody CouponCreateRequest request) {
        try {
            return ResponseEntity.ok(adminCouponService.createCoupon(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCoupon(@PathVariable Long id, @RequestBody CouponUpdateRequest request) {
        try {
            return ResponseEntity.ok(adminCouponService.updateCoupon(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam boolean active) {
        try {
            return ResponseEntity.ok(adminCouponService.updateStatus(id, active));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/usage")
    public ResponseEntity<?> getUsageStatistics(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminCouponService.getUsageStatistics(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
