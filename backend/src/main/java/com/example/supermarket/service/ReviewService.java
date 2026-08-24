package com.example.supermarket.service;

import com.example.supermarket.dto.ProductReviewDto;
import com.example.supermarket.dto.ReviewEligibilityDto;
import com.example.supermarket.dto.ReviewRequest;
import com.example.supermarket.dto.ReviewSummaryDto;
import com.example.supermarket.model.Product;
import com.example.supermarket.model.ProductReview;
import com.example.supermarket.model.User;
import com.example.supermarket.repository.OrderItemRepository;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.repository.ProductReviewRepository;
import com.example.supermarket.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;

    public ReviewService(ProductReviewRepository reviewRepository,
                         ProductRepository productRepository,
                         UserRepository userRepository,
                         OrderItemRepository orderItemRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderItemRepository = orderItemRepository;
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Product getProductById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public List<ProductReviewDto> getReviews(Long productId) {
        Product product = getProductById(productId);
        return reviewRepository.findByProductOrderByIdDesc(product)
                .stream()
                .map(ProductReviewDto::from)
                .toList();
    }

    public ReviewSummaryDto getSummary(Long productId) {
        Product product = getProductById(productId);
        long count = reviewRepository.countReviews(product);
        java.math.BigDecimal average = reviewRepository.getAverageRating(product);
        // Round average to 1 decimal place
        average = average.setScale(1, java.math.RoundingMode.HALF_UP);
        return new ReviewSummaryDto(average, count);
    }

    public ReviewEligibilityDto checkEligibility(Long productId, String username) {
        User user = getUserByUsername(username);
        Product product = getProductById(productId);

        long purchases = orderItemRepository.countPurchases(username, productId, List.of("CONFIRMED", "DELIVERED"));
        boolean eligible = purchases > 0;

        Optional<ProductReview> review = reviewRepository.findByUserAndProduct(user, product);
        
        return new ReviewEligibilityDto(eligible, review.isPresent(), review.map(ProductReview::getId).orElse(null));
    }

    @Transactional
    public ProductReviewDto createReview(Long productId, ReviewRequest request, String username) {
        if (request.rating() == null || request.rating() < 1 || request.rating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        ReviewEligibilityDto eligibility = checkEligibility(productId, username);
        if (!eligibility.eligible()) {
            throw new SecurityException("You must purchase this product before reviewing it");
        }
        if (eligibility.hasReviewed()) {
            throw new IllegalStateException("You have already reviewed this product");
        }

        User user = getUserByUsername(username);
        Product product = getProductById(productId);

        ProductReview review = new ProductReview(user, product, request.rating(), request.comment());
        ProductReview saved = reviewRepository.save(review);
        return ProductReviewDto.from(saved);
    }

    @Transactional
    public ProductReviewDto updateReview(Long productId, Long reviewId, ReviewRequest request, String username) {
        if (request.rating() == null || request.rating() < 1 || request.rating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        User user = getUserByUsername(username);
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUser().getId().equals(user.getId()) || !review.getProduct().getId().equals(productId)) {
            throw new SecurityException("You are not authorized to edit this review");
        }

        review.setRating(request.rating());
        review.setComment(request.comment());
        ProductReview saved = reviewRepository.save(review);
        return ProductReviewDto.from(saved);
    }

    @Transactional
    public void deleteReview(Long productId, Long reviewId, String username) {
        User user = getUserByUsername(username);
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUser().getId().equals(user.getId()) || !review.getProduct().getId().equals(productId)) {
            throw new SecurityException("You are not authorized to delete this review");
        }

        reviewRepository.delete(review);
    }
}
