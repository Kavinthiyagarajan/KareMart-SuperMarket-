package com.example.supermarket.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

public record AdminOrderDetailsDto(
    String orderNumber,
    String customerId,
    String status,
    BigDecimal subtotal,
    BigDecimal tax,
    BigDecimal discount,
    BigDecimal total,
    String couponCode,
    ZonedDateTime createdAt,
    String paymentMethod,
    String paymentStatus,
    String providerPaymentId,
    DeliveryDto delivery,
    List<OrderItemDto> items
) {}
