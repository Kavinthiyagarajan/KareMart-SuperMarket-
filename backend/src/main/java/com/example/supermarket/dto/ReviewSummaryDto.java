package com.example.supermarket.dto;

import java.math.BigDecimal;

public record ReviewSummaryDto(
        BigDecimal averageRating,
        long totalReviews
) {}
