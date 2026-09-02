package com.example.supermarket.dto;

public record AdminReviewRequest(
    boolean approve,
    String adminNotes
) {}
