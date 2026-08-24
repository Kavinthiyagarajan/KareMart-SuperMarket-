package com.example.supermarket.dto;

import com.example.supermarket.model.PaymentMethod;

public record PaymentCreationRequest(
    String orderNumber,
    PaymentMethod paymentMethod,
    String idempotencyKey
) {}
