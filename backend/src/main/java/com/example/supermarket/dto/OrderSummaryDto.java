package com.example.supermarket.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record OrderSummaryDto(
    String orderNumber,
    String status,
    BigDecimal total,
    ZonedDateTime createdAt,
    DeliveryDto delivery
) {}
