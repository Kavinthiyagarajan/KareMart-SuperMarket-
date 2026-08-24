package com.example.supermarket.service;

import com.example.supermarket.dto.AdminCouponDto;
import com.example.supermarket.dto.AdminCouponUsageDto;
import com.example.supermarket.dto.CouponCreateRequest;
import com.example.supermarket.dto.CouponUpdateRequest;
import com.example.supermarket.model.Coupon;
import com.example.supermarket.model.DiscountType;
import com.example.supermarket.repository.CouponRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class AdminCouponService {

    private final CouponRepository couponRepository;

    public AdminCouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    private AdminCouponDto mapToDto(Coupon c) {
        return new AdminCouponDto(
            c.getId(), c.getCode(), c.getDescription(), c.getDiscountType(), c.getDiscountValue(),
            c.getMinOrderValue(), c.getMaxDiscount(), c.getUsageLimit(), c.getPerCustomerLimit(),
            c.getCurrentUsage(), c.getValidFrom(), c.getValidUntil(), c.getActive(), c.getCreatedAt(), c.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public Page<AdminCouponDto> listCoupons(String code, Pageable pageable) {
        if (code != null && !code.trim().isEmpty()) {
            return couponRepository.findByCodeContainingIgnoreCase(code.trim(), pageable).map(this::mapToDto);
        }
        return couponRepository.findAll(pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public AdminCouponDto getCoupon(Long id) {
        return couponRepository.findById(id).map(this::mapToDto)
            .orElseThrow(() -> new RuntimeException("Coupon not found"));
    }

    @Transactional
    public AdminCouponDto createCoupon(CouponCreateRequest request) {
        if (request.code() == null || request.code().trim().isEmpty()) {
            throw new IllegalArgumentException("Coupon code is required");
        }
        
        String normalizedCode = request.code().trim().toUpperCase();
        if (couponRepository.findByCode(normalizedCode).isPresent()) {
            throw new IllegalArgumentException("Coupon code already exists");
        }

        if (request.discountValue() == null || request.discountValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Discount value must be positive");
        }
        
        if (request.discountType() == DiscountType.PERCENTAGE && request.discountValue().compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("Percentage discount cannot exceed 100");
        }

        if (request.minOrderValue() != null && request.minOrderValue().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Minimum order value cannot be negative");
        }

        if (request.maxDiscount() != null && request.maxDiscount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Maximum discount cannot be negative");
        }

        if (request.usageLimit() != null && request.usageLimit() < 0) {
            throw new IllegalArgumentException("Usage limit cannot be negative");
        }

        if (request.perCustomerLimit() != null && request.perCustomerLimit() < 0) {
            throw new IllegalArgumentException("Per customer limit cannot be negative");
        }

        if (request.validFrom() != null && request.validUntil() != null && request.validUntil().isBefore(request.validFrom())) {
            throw new IllegalArgumentException("validUntil must not precede validFrom");
        }

        Coupon coupon = new Coupon();
        coupon.setCode(normalizedCode);
        coupon.setDescription(request.description());
        coupon.setDiscountType(request.discountType());
        coupon.setDiscountValue(request.discountValue());
        coupon.setMinOrderValue(request.minOrderValue());
        coupon.setMaxDiscount(request.maxDiscount());
        coupon.setUsageLimit(request.usageLimit());
        coupon.setPerCustomerLimit(request.perCustomerLimit());
        coupon.setValidFrom(request.validFrom());
        coupon.setValidUntil(request.validUntil());
        coupon.setActive(request.active() != null ? request.active() : true);
        coupon.setCurrentUsage(0);

        return mapToDto(couponRepository.save(coupon));
    }

    @Transactional
    public AdminCouponDto updateCoupon(Long id, CouponUpdateRequest request) {
        Coupon coupon = couponRepository.findById(id).orElseThrow(() -> new RuntimeException("Coupon not found"));

        if (request.minOrderValue() != null && request.minOrderValue().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Minimum order value cannot be negative");
        }
        if (request.maxDiscount() != null && request.maxDiscount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Maximum discount cannot be negative");
        }
        if (request.usageLimit() != null && request.usageLimit() < 0) {
            throw new IllegalArgumentException("Usage limit cannot be negative");
        }
        if (request.perCustomerLimit() != null && request.perCustomerLimit() < 0) {
            throw new IllegalArgumentException("Per customer limit cannot be negative");
        }
        if (request.validFrom() != null && request.validUntil() != null && request.validUntil().isBefore(request.validFrom())) {
            throw new IllegalArgumentException("validUntil must not precede validFrom");
        }

        coupon.setDescription(request.description());
        coupon.setMinOrderValue(request.minOrderValue());
        coupon.setMaxDiscount(request.maxDiscount());
        coupon.setUsageLimit(request.usageLimit());
        coupon.setPerCustomerLimit(request.perCustomerLimit());
        coupon.setValidFrom(request.validFrom());
        coupon.setValidUntil(request.validUntil());

        return mapToDto(couponRepository.save(coupon));
    }

    @Transactional
    public AdminCouponDto updateStatus(Long id, boolean active) {
        Coupon coupon = couponRepository.findById(id).orElseThrow(() -> new RuntimeException("Coupon not found"));
        coupon.setActive(active);
        return mapToDto(couponRepository.save(coupon));
    }

    @Transactional(readOnly = true)
    public AdminCouponUsageDto getUsageStatistics(Long id) {
        Coupon coupon = couponRepository.findById(id).orElseThrow(() -> new RuntimeException("Coupon not found"));
        Integer remainingUsage = null;
        if (coupon.getUsageLimit() != null) {
            remainingUsage = Math.max(0, coupon.getUsageLimit() - coupon.getCurrentUsage());
        }
        return new AdminCouponUsageDto(
            coupon.getCurrentUsage(),
            coupon.getUsageLimit(),
            coupon.getPerCustomerLimit(),
            remainingUsage
        );
    }
}
