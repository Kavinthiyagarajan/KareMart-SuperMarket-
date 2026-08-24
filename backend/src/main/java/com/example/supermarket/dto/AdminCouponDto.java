package com.example.supermarket.dto;

import com.example.supermarket.model.DiscountType;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record AdminCouponDto(
    Long id,
    String code,
    String description,
    DiscountType discountType,
    BigDecimal discountValue,
    BigDecimal minOrderValue,
    BigDecimal maxDiscount,
    Integer usageLimit,
    Integer perCustomerLimit,
    Integer currentUsage,
    ZonedDateTime validFrom,
    ZonedDateTime validUntil,
    Boolean active,
    ZonedDateTime createdAt,
    ZonedDateTime updatedAt
) {}
