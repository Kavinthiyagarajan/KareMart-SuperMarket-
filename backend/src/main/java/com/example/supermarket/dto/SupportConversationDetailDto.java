package com.example.supermarket.dto;

import com.example.supermarket.model.ConversationStatus;
import com.example.supermarket.model.RequestType;

import java.time.ZonedDateTime;
import java.util.List;

public record SupportConversationDetailDto(
    Long id,
    Long userId,
    String username,
    String subject,
    RequestType requestType,
    Long productId,
    String productName,
    String productImageUrl,
    ConversationStatus status,
    ZonedDateTime createdAt,
    ZonedDateTime updatedAt,
    List<SupportMessageDto> messages
) {}
