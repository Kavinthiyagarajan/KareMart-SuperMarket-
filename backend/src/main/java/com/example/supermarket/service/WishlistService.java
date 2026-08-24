package com.example.supermarket.service;

import com.example.supermarket.dto.WishlistItemDto;
import com.example.supermarket.model.Product;
import com.example.supermarket.model.User;
import com.example.supermarket.model.WishlistItem;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.repository.UserRepository;
import com.example.supermarket.repository.WishlistItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public WishlistService(WishlistItemRepository wishlistItemRepository,
                           UserRepository userRepository,
                           ProductRepository productRepository) {
        this.wishlistItemRepository = wishlistItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<WishlistItemDto> getMyWishlist(String username) {
        User user = getUserByUsername(username);
        return wishlistItemRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(WishlistItemDto::from)
                .toList();
    }

    @Transactional
    public WishlistItemDto addToWishlist(Long productId, String username) {
        User user = getUserByUsername(username);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Optional<WishlistItem> existing = wishlistItemRepository.findByUserAndProductId(user, productId);
        if (existing.isPresent()) {
            return WishlistItemDto.from(existing.get());
        }

        WishlistItem item = new WishlistItem(user, product);
        WishlistItem saved = wishlistItemRepository.save(item);
        return WishlistItemDto.from(saved);
    }

    @Transactional
    public void removeFromWishlist(Long productId, String username) {
        User user = getUserByUsername(username);
        wishlistItemRepository.findByUserAndProductId(user, productId)
                .ifPresent(wishlistItemRepository::delete);
    }

    public boolean isWishlisted(Long productId, String username) {
        User user = getUserByUsername(username);
        return wishlistItemRepository.existsByUserAndProductId(user, productId);
    }
}
