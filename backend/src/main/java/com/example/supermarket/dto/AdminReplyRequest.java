package com.example.supermarket.dto;

import com.example.supermarket.model.AvailabilityStatus;
import com.example.supermarket.model.ConversationStatus;

import java.time.ZonedDateTime;

public record AdminReplyRequest(
    String message,
    AvailabilityStatus availabilityStatus,
    ZonedDateTime availableAt,
    ConversationStatus newStatus
) {}
