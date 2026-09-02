package com.example.supermarket.dto;

import com.example.supermarket.model.AvailabilityStatus;
import com.example.supermarket.model.SenderType;

import java.time.ZonedDateTime;

public record SupportMessageDto(
    Long id,
    Long conversationId,
    SenderType senderType,
    String senderUsername,
    String message,
    AvailabilityStatus availabilityStatus,
    ZonedDateTime availableAt,
    ZonedDateTime createdAt
) {}
