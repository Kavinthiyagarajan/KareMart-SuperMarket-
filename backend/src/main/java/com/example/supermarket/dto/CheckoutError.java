package com.example.supermarket.dto;

public record CheckoutError(
    Long productId,
    String message,
    String reason // e.g., "OUT_OF_STOCK", "QUANTITY_EXCEEDED"
) {}
