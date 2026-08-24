package com.example.supermarket.service;

import com.example.supermarket.dto.CouponValidationResult;
import com.example.supermarket.model.Coupon;
import com.example.supermarket.model.CouponUsage;
import com.example.supermarket.model.DiscountType;
import com.example.supermarket.repository.CouponRepository;
import com.example.supermarket.repository.CouponUsageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZonedDateTime;

@Service
public class PromotionService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    public PromotionService(CouponRepository couponRepository, CouponUsageRepository couponUsageRepository) {
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
    }

    public CouponValidationResult validateCoupon(String code, BigDecimal subtotal, String customerId) {
        if (code == null || code.trim().isEmpty()) {
            return new CouponValidationResult(false, BigDecimal.ZERO, "Coupon code is empty", null);
        }

        String normalizedCode = code.trim().toUpperCase();
        Coupon coupon = couponRepository.findByCode(normalizedCode).orElse(null);

        if (coupon == null) {
            return new CouponValidationResult(false, BigDecimal.ZERO, "Invalid coupon code", normalizedCode);
        }

        if (!coupon.getActive()) {
            return new CouponValidationResult(false, BigDecimal.ZERO, "Coupon is no longer active", normalizedCode);
        }

        ZonedDateTime now = ZonedDateTime.now();
        if (coupon.getValidFrom() != null && now.isBefore(coupon.getValidFrom())) {
            return new CouponValidationResult(false, BigDecimal.ZERO, "Coupon is not yet valid", normalizedCode);
        }
        if (coupon.getValidUntil() != null && now.isAfter(coupon.getValidUntil())) {
            return new CouponValidationResult(false, BigDecimal.ZERO, "Coupon has expired", normalizedCode);
        }

        if (coupon.getMinOrderValue() != null && subtotal.compareTo(coupon.getMinOrderValue()) < 0) {
            return new CouponValidationResult(false, BigDecimal.ZERO, "Minimum order value of $" + coupon.getMinOrderValue() + " not met", normalizedCode);
        }

        if (coupon.getUsageLimit() != null && coupon.getCurrentUsage() >= coupon.getUsageLimit()) {
            return new CouponValidationResult(false, BigDecimal.ZERO, "Coupon usage limit reached", normalizedCode);
        }

        if (coupon.getPerCustomerLimit() != null && customerId != null && !"GUEST".equals(customerId)) {
            long userUsage = couponUsageRepository.countByCouponIdAndCustomerId(coupon.getId(), customerId);
            if (userUsage >= coupon.getPerCustomerLimit()) {
                return new CouponValidationResult(false, BigDecimal.ZERO, "You have reached the usage limit for this coupon", normalizedCode);
            }
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (coupon.getDiscountType() == DiscountType.FIXED_AMOUNT) {
            discountAmount = coupon.getDiscountValue();
        } else if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            discountAmount = subtotal.multiply(coupon.getDiscountValue()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        }

        if (coupon.getMaxDiscount() != null && discountAmount.compareTo(coupon.getMaxDiscount()) > 0) {
            discountAmount = coupon.getMaxDiscount();
        }

        if (discountAmount.compareTo(subtotal) > 0) {
            discountAmount = subtotal;
        }

        return new CouponValidationResult(true, discountAmount, null, normalizedCode);
    }

    @Transactional
    public void recordUsage(String code, String customerId, String orderNumber) {
        if (code == null || code.trim().isEmpty()) return;

        String normalizedCode = code.trim().toUpperCase();
        Coupon coupon = couponRepository.findByCode(normalizedCode)
                .orElseThrow(() -> new RuntimeException("Coupon not found during usage recording"));

        // Atomically increment current usage if under limit
        int updatedRows = couponRepository.incrementUsage(coupon.getId());
        if (updatedRows == 0 && coupon.getUsageLimit() != null) {
            throw new RuntimeException("Coupon usage limit exceeded concurrently");
        }

        if (customerId != null && !"GUEST".equals(customerId)) {
            CouponUsage usage = new CouponUsage();
            usage.setCoupon(coupon);
            usage.setCustomerId(customerId);
            usage.setOrderNumber(orderNumber);
            try {
                couponUsageRepository.save(usage);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // Ignore or handle if we are double-recording for the same order, but it shouldn't happen normally
                throw new RuntimeException("Coupon already applied to this order");
            }
        }
    }
}
