package com.example.supermarket.dto;

import com.example.supermarket.model.RequestType;

public record CreateConversationRequest(
    String subject,
    RequestType requestType,
    Long productId,
    String message
) {}
