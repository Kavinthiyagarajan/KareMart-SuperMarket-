package com.example.supermarket.dto;

import com.example.supermarket.model.RefundStatus;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record CustomerRefundDto(
    String requestType, // "CANCELLATION" or "RETURN"
    Long requestId,
    String orderNumber,
    BigDecimal amount,
    RefundStatus refundStatus,
    String reason,
    String notes,
    ZonedDateTime requestedAt,
    ZonedDateTime updatedAt,
    String adminNotes
) {}
