package com.example.supermarket.dto;

import com.example.supermarket.model.ProductReview;
import java.time.ZonedDateTime;

public record ProductReviewDto(
        Long id,
        String username,
        Integer rating,
        String comment,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt
) {
    public static ProductReviewDto from(ProductReview review) {
        return new ProductReviewDto(
                review.getId(),
                review.getUser().getUsername(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
