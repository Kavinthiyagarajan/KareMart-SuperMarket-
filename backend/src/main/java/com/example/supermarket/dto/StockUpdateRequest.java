package com.example.supermarket.dto;

public record StockUpdateRequest(
    String operation, // "SET", "ADD", "SUBTRACT"
    Integer amount
) {}
