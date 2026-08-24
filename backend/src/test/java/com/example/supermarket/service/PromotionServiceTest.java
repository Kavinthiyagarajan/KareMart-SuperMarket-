package com.example.supermarket.service;

import com.example.supermarket.dto.CouponValidationResult;
import com.example.supermarket.model.Coupon;
import com.example.supermarket.model.DiscountType;
import com.example.supermarket.repository.CouponRepository;
import com.example.supermarket.repository.CouponUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class PromotionServiceTest {

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private CouponUsageRepository couponUsageRepository;

    @InjectMocks
    private PromotionService promotionService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void validateCoupon_PercentageDiscount_Valid() {
        Coupon coupon = new Coupon();
        coupon.setCode("SAVE10");
        coupon.setDiscountType(DiscountType.PERCENTAGE);
        coupon.setDiscountValue(new BigDecimal("10.00"));
        coupon.setActive(true);
        coupon.setMaxDiscount(new BigDecimal("50.00"));

        when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));

        CouponValidationResult result = promotionService.validateCoupon("save10", new BigDecimal("200.00"), "user1");

        assertTrue(result.valid());
        assertEquals(new BigDecimal("20.00"), result.discountAmount());
    }

    @Test
    void validateCoupon_MaxDiscountApplied() {
        Coupon coupon = new Coupon();
        coupon.setCode("SAVE50");
        coupon.setDiscountType(DiscountType.PERCENTAGE);
        coupon.setDiscountValue(new BigDecimal("50.00"));
        coupon.setActive(true);
        coupon.setMaxDiscount(new BigDecimal("30.00"));

        when(couponRepository.findByCode("SAVE50")).thenReturn(Optional.of(coupon));

        CouponValidationResult result = promotionService.validateCoupon("SAVE50", new BigDecimal("100.00"), "user1");

        assertTrue(result.valid());
        assertEquals(new BigDecimal("30.00"), result.discountAmount());
    }

    @Test
    void validateCoupon_FixedAmount_Valid() {
        Coupon coupon = new Coupon();
        coupon.setCode("MINUS15");
        coupon.setDiscountType(DiscountType.FIXED_AMOUNT);
        coupon.setDiscountValue(new BigDecimal("15.00"));
        coupon.setActive(true);

        when(couponRepository.findByCode("MINUS15")).thenReturn(Optional.of(coupon));

        CouponValidationResult result = promotionService.validateCoupon("MINUS15", new BigDecimal("50.00"), "user1");

        assertTrue(result.valid());
        assertEquals(new BigDecimal("15.00"), result.discountAmount());
    }

    @Test
    void validateCoupon_MinOrderValueNotMet() {
        Coupon coupon = new Coupon();
        coupon.setCode("SAVE10");
        coupon.setDiscountType(DiscountType.FIXED_AMOUNT);
        coupon.setDiscountValue(new BigDecimal("10.00"));
        coupon.setMinOrderValue(new BigDecimal("50.00"));
        coupon.setActive(true);

        when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));

        CouponValidationResult result = promotionService.validateCoupon("SAVE10", new BigDecimal("40.00"), "user1");

        assertFalse(result.valid());
        assertTrue(result.errorMessage().contains("Minimum order value"));
    }

    @Test
    void validateCoupon_Expired() {
        Coupon coupon = new Coupon();
        coupon.setCode("OLD");
        coupon.setActive(true);
        coupon.setValidUntil(ZonedDateTime.now().minusDays(1));

        when(couponRepository.findByCode("OLD")).thenReturn(Optional.of(coupon));

        CouponValidationResult result = promotionService.validateCoupon("OLD", new BigDecimal("100.00"), "user1");

        assertFalse(result.valid());
        assertTrue(result.errorMessage().contains("expired"));
    }
}
