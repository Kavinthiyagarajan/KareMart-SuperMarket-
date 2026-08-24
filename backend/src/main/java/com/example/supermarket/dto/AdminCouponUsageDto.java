package com.example.supermarket.dto;

public record AdminCouponUsageDto(
    Integer totalUsage,
    Integer usageLimit,
    Integer perCustomerLimit,
    Integer remainingUsage
) {}
