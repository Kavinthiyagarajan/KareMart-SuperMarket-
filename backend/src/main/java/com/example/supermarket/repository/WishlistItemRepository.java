package com.example.supermarket.repository;

import com.example.supermarket.model.User;
import com.example.supermarket.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByUserOrderByCreatedAtDesc(User user);
    Optional<WishlistItem> findByUserAndProductId(User user, Long productId);
    boolean existsByUserAndProductId(User user, Long productId);
}
