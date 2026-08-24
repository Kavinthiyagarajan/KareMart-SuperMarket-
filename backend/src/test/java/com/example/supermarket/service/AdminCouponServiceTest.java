package com.example.supermarket.service;

import com.example.supermarket.dto.AdminCouponDto;
import com.example.supermarket.dto.AdminCouponUsageDto;
import com.example.supermarket.dto.CouponCreateRequest;
import com.example.supermarket.dto.CouponUpdateRequest;
import com.example.supermarket.model.Coupon;
import com.example.supermarket.model.DiscountType;
import com.example.supermarket.repository.CouponRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminCouponServiceTest {

    @Mock
    private CouponRepository couponRepository;

    @InjectMocks
    private AdminCouponService adminCouponService;

    private Coupon coupon;

    @BeforeEach
    void setUp() {
        coupon = new Coupon();
        coupon.setId(1L);
        coupon.setCode("SUMMER10");
        coupon.setDiscountType(DiscountType.PERCENTAGE);
        coupon.setDiscountValue(new BigDecimal("10.0"));
        coupon.setActive(true);
        coupon.setCurrentUsage(5);
        coupon.setUsageLimit(10);
    }

    @Test
    void listCoupons_ReturnsPage() {
        Pageable pageable = PageRequest.of(0, 10);
        when(couponRepository.findAll(pageable)).thenReturn(new PageImpl<>(Collections.singletonList(coupon)));

        Page<AdminCouponDto> result = adminCouponService.listCoupons(null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("SUMMER10", result.getContent().get(0).code());
    }

    @Test
    void createCoupon_Success() {
        CouponCreateRequest request = new CouponCreateRequest(
            "WINTER20", "Winter sale", DiscountType.FIXED_AMOUNT, new BigDecimal("20.0"), 
            BigDecimal.ZERO, null, 100, 1, null, null, true
        );

        when(couponRepository.findByCode("WINTER20")).thenReturn(Optional.empty());
        when(couponRepository.save(any(Coupon.class))).thenAnswer(invocation -> {
            Coupon c = invocation.getArgument(0);
            c.setId(2L);
            return c;
        });

        AdminCouponDto result = adminCouponService.createCoupon(request);

        assertNotNull(result);
        assertEquals("WINTER20", result.code());
        assertEquals(new BigDecimal("20.0"), result.discountValue());
    }

    @Test
    void createCoupon_DuplicateCode_ThrowsException() {
        CouponCreateRequest request = new CouponCreateRequest(
            "SUMMER10", "Summer sale", DiscountType.PERCENTAGE, new BigDecimal("10.0"), 
            BigDecimal.ZERO, null, 100, 1, null, null, true
        );

        when(couponRepository.findByCode("SUMMER10")).thenReturn(Optional.of(coupon));

        assertThrows(IllegalArgumentException.class, () -> adminCouponService.createCoupon(request));
    }

    @Test
    void createCoupon_NegativeDiscount_ThrowsException() {
        CouponCreateRequest request = new CouponCreateRequest(
            "WINTER20", "Winter sale", DiscountType.FIXED_AMOUNT, new BigDecimal("-5.0"), 
            BigDecimal.ZERO, null, 100, 1, null, null, true
        );

        assertThrows(IllegalArgumentException.class, () -> adminCouponService.createCoupon(request));
    }

    @Test
    void updateCoupon_Success() {
        CouponUpdateRequest request = new CouponUpdateRequest(
            "Updated desc", new BigDecimal("50.0"), null, 20, 2, null, null
        );

        when(couponRepository.findById(1L)).thenReturn(Optional.of(coupon));
        when(couponRepository.save(any(Coupon.class))).thenReturn(coupon);

        AdminCouponDto result = adminCouponService.updateCoupon(1L, request);

        assertEquals("Updated desc", result.description());
        assertEquals(new BigDecimal("50.0"), result.minOrderValue());
        assertEquals(20, result.usageLimit());
    }

    @Test
    void updateStatus_Success() {
        when(couponRepository.findById(1L)).thenReturn(Optional.of(coupon));
        when(couponRepository.save(any(Coupon.class))).thenReturn(coupon);

        AdminCouponDto result = adminCouponService.updateStatus(1L, false);

        assertFalse(result.active());
    }

    @Test
    void getUsageStatistics_Success() {
        when(couponRepository.findById(1L)).thenReturn(Optional.of(coupon));

        AdminCouponUsageDto result = adminCouponService.getUsageStatistics(1L);

        assertEquals(5, result.totalUsage());
        assertEquals(10, result.usageLimit());
        assertEquals(5, result.remainingUsage());
    }
}
