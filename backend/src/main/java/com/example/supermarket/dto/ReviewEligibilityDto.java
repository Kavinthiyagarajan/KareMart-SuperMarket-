package com.example.supermarket.dto;

public record ReviewEligibilityDto(
        boolean eligible,
        boolean hasReviewed,
        Long reviewId
) {}
