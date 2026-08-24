package com.example.supermarket.controller;

import com.example.supermarket.dto.ProductReviewDto;
import com.example.supermarket.dto.ReviewEligibilityDto;
import com.example.supermarket.dto.ReviewRequest;
import com.example.supermarket.dto.ReviewSummaryDto;
import com.example.supermarket.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products/{productId}/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<List<ProductReviewDto>> getReviews(@PathVariable Long productId) {
        try {
            return ResponseEntity.ok(reviewService.getReviews(productId));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<ReviewSummaryDto> getSummary(@PathVariable Long productId) {
        try {
            return ResponseEntity.ok(reviewService.getSummary(productId));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/eligibility")
    public ResponseEntity<ReviewEligibilityDto> checkEligibility(@PathVariable Long productId, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            return ResponseEntity.ok(reviewService.checkEligibility(productId, principal.getName()));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> submitReview(@PathVariable Long productId, @RequestBody ReviewRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        try {
            ProductReviewDto review = reviewService.createReview(productId, request, principal.getName());
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SecurityException | IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(@PathVariable Long productId, @PathVariable Long reviewId, @RequestBody ReviewRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        try {
            ProductReviewDto review = reviewService.updateReview(productId, reviewId, request, principal.getName());
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long productId, @PathVariable Long reviewId, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        try {
            reviewService.deleteReview(productId, reviewId, principal.getName());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
