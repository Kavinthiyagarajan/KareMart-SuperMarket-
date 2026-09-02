package com.example.supermarket.dto;

import com.example.supermarket.model.ReturnReason;

public record ReturnOrderRequest(
    ReturnReason reason,
    String notes
) {}
