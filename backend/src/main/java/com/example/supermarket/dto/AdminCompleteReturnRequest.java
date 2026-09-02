package com.example.supermarket.dto;

public record AdminCompleteReturnRequest(
    boolean restockItems,
    String adminNotes
) {}
