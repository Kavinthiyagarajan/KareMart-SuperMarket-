package com.example.supermarket.dto;

import java.util.List;

public record CartResponseDto(
    List<CartItemResponseDto> items
) {}
