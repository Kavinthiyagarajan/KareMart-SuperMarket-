package com.example.supermarket.dto;

import com.example.supermarket.model.ConversationStatus;

public record UpdateStatusRequest(
    ConversationStatus status
) {}
