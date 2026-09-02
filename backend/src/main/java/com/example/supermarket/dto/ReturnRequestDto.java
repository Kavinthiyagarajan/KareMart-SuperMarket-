package com.example.supermarket.dto;

import com.example.supermarket.model.RefundStatus;
import com.example.supermarket.model.RequestStatus;
import com.example.supermarket.model.ReturnReason;
import com.example.supermarket.model.ReturnRequest;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record ReturnRequestDto(
    Long id,
    String orderNumber,
    String userId,
    ReturnReason reason,
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
    public static ReturnRequestDto fromEntity(ReturnRequest entity) {
        if (entity == null) return null;
        return new ReturnRequestDto(
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
