
package com.example.supermarket.repository;

import com.example.supermarket.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    java.util.Optional<CartItem> findByCartAndProduct(com.example.supermarket.model.Cart cart, com.example.supermarket.model.Product product);
}
