package com.example.supermarket.dto;

import java.math.BigDecimal;

public record CouponValidationResult(
    boolean valid,
    BigDecimal discountAmount,
    String errorMessage,
    String normalizedCode
) {}
