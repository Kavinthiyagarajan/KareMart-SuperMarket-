package com.example.supermarket.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record CouponUpdateRequest(
    String description,
    BigDecimal minOrderValue,
    BigDecimal maxDiscount,
    Integer usageLimit,
    Integer perCustomerLimit,
    ZonedDateTime validFrom,
    ZonedDateTime validUntil
) {}
