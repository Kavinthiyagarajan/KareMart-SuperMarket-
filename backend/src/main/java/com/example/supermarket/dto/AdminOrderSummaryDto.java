package com.example.supermarket.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record AdminOrderSummaryDto(
    String orderNumber,
    String customerId,
    String status,
    BigDecimal total,
    ZonedDateTime createdAt,
    String paymentStatus,
    String deliveryStatus
) {}
