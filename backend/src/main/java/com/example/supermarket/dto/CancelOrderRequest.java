package com.example.supermarket.dto;

import com.example.supermarket.model.CancellationReason;

public record CancelOrderRequest(
    CancellationReason reason,
    String notes
) {}
