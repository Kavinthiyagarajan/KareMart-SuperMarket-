package com.example.supermarket.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CheckoutRequest(
    @NotEmpty(message = "Items cannot be empty")
    List<CartItemDto> items,
    @NotNull(message = "Address ID is required")
    Long addressId,
    String couponCode
) {}
