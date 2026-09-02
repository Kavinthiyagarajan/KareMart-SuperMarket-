package com.example.supermarket.repository;

import com.example.supermarket.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdOrderByIdDesc(Long productId);
    java.util.Optional<Review> findByUsernameAndProductId(String username, Long productId);
}
