package com.example.supermarket.repository;

import com.example.supermarket.model.Product;
import com.example.supermarket.model.ProductReview;
import com.example.supermarket.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProductOrderByIdDesc(Product product);
    Optional<ProductReview> findByUserAndProduct(User user, Product product);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM ProductReview r WHERE r.product = :product")
    java.math.BigDecimal getAverageRating(@Param("product") Product product);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product = :product")
    long countReviews(@Param("product") Product product);
}
