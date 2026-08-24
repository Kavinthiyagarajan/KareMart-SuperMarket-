package com.example.supermarket.dto;

import com.example.supermarket.model.Product;

public record CartItemResponseDto(
    Product product,
    Integer quantity
) {}
