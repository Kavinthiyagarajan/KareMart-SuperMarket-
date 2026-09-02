package com.example.supermarket.dto;

import com.example.supermarket.model.CancellationReason;
import com.example.supermarket.model.CancellationRequest;
import com.example.supermarket.model.RefundStatus;
import com.example.supermarket.model.RequestStatus;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record CancellationRequestDto(
    Long id,
    String orderNumber,
    String userId,
    CancellationReason reason,
    String notes,
    RequestStatus status,
    RefundStatus refundStatus,
    BigDecimal refundAmount,
    ZonedDateTime createdAt,
    ZonedDateTime updatedAt,
    String reviewedBy,
    ZonedDateTime reviewedAt,
    String adminNotes
) {
    public static CancellationRequestDto fromEntity(CancellationRequest entity) {
        if (entity == null) return null;
        return new CancellationRequestDto(
            entity.getId(),
            entity.getOrderNumber(),
            entity.getUserId(),
            entity.getReason(),
            entity.getNotes(),
            entity.getStatus(),
            entity.getRefundStatus(),
            entity.getRefundAmount(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getReviewedBy(),
            entity.getReviewedAt(),
            entity.getAdminNotes()
        );
    }
}
