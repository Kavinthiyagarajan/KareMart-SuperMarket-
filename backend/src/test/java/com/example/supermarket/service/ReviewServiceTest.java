package com.example.supermarket.service;

import com.example.supermarket.dto.ProductReviewDto;
import com.example.supermarket.dto.ReviewEligibilityDto;
import com.example.supermarket.dto.ReviewRequest;
import com.example.supermarket.model.Product;
import com.example.supermarket.model.ProductReview;
import com.example.supermarket.model.Role;
import com.example.supermarket.model.User;
import com.example.supermarket.repository.OrderItemRepository;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.repository.ProductReviewRepository;
import com.example.supermarket.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReviewServiceTest {

    @Mock
    private ProductReviewRepository reviewRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private ReviewService reviewService;

    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testUser = new User("customer1", "pass", Role.CUSTOMER);
        testUser.setId(1L);

        testProduct = new Product();
        testProduct.setId(10L);
    }

    @Test
    void testCheckEligibilityEligible() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderItemRepository.countPurchases(eq("customer1"), eq(10L), any())).thenReturn(1L);
        when(reviewRepository.findByUserAndProduct(testUser, testProduct)).thenReturn(Optional.empty());

        ReviewEligibilityDto eligibility = reviewService.checkEligibility(10L, "customer1");
        assertTrue(eligibility.eligible());
        assertFalse(eligibility.hasReviewed());
    }

    @Test
    void testCheckEligibilityNotEligible() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderItemRepository.countPurchases(eq("customer1"), eq(10L), any())).thenReturn(0L);
        when(reviewRepository.findByUserAndProduct(testUser, testProduct)).thenReturn(Optional.empty());

        ReviewEligibilityDto eligibility = reviewService.checkEligibility(10L, "customer1");
        assertFalse(eligibility.eligible());
    }

    @Test
    void testCreateReviewSuccess() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderItemRepository.countPurchases(eq("customer1"), eq(10L), any())).thenReturn(1L);
        when(reviewRepository.findByUserAndProduct(testUser, testProduct)).thenReturn(Optional.empty());

        ProductReview saved = new ProductReview(testUser, testProduct, 5, "Great!");
        saved.setId(100L);
        when(reviewRepository.save(any())).thenReturn(saved);

        ProductReviewDto dto = reviewService.createReview(10L, new ReviewRequest(5, "Great!"), "customer1");
        assertNotNull(dto);
        assertEquals(5, dto.rating());
    }

    @Test
    void testCreateReviewFailsWithoutPurchase() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderItemRepository.countPurchases(eq("customer1"), eq(10L), any())).thenReturn(0L);
        when(reviewRepository.findByUserAndProduct(testUser, testProduct)).thenReturn(Optional.empty());

        assertThrows(SecurityException.class, () -> {
            reviewService.createReview(10L, new ReviewRequest(5, "Great!"), "customer1");
        });
    }

    @Test
    void testCreateReviewInvalidRating() {
        assertThrows(IllegalArgumentException.class, () -> {
            reviewService.createReview(10L, new ReviewRequest(6, "Great!"), "customer1");
        });
        assertThrows(IllegalArgumentException.class, () -> {
            reviewService.createReview(10L, new ReviewRequest(0, "Great!"), "customer1");
        });
    }

    @Test
    void testUpdateReviewSuccess() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        ProductReview existing = new ProductReview(testUser, testProduct, 4, "Good");
        existing.setId(100L);
        when(reviewRepository.findById(100L)).thenReturn(Optional.of(existing));
        when(reviewRepository.save(any())).thenReturn(existing);

        ProductReviewDto dto = reviewService.updateReview(10L, 100L, new ReviewRequest(5, "Better now"), "customer1");
        assertEquals(5, dto.rating());
        assertEquals("Better now", existing.getComment());
    }

    @Test
    void testUpdateReviewNotOwner() {
        User otherUser = new User("other", "pass", Role.CUSTOMER);
        otherUser.setId(2L);
        when(userRepository.findByUsername("other")).thenReturn(Optional.of(otherUser));
        
        ProductReview existing = new ProductReview(testUser, testProduct, 4, "Good");
        existing.setId(100L);
        when(reviewRepository.findById(100L)).thenReturn(Optional.of(existing));

        assertThrows(SecurityException.class, () -> {
            reviewService.updateReview(10L, 100L, new ReviewRequest(5, "Better now"), "other");
        });
    }

    @Test
    void testDeleteReviewSuccess() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        ProductReview existing = new ProductReview(testUser, testProduct, 4, "Good");
        existing.setId(100L);
        when(reviewRepository.findById(100L)).thenReturn(Optional.of(existing));

        reviewService.deleteReview(10L, 100L, "customer1");
        verify(reviewRepository, times(1)).delete(existing);
    }
}
