package com.example.supermarket.controller;

import com.example.supermarket.dto.WishlistItemDto;
import com.example.supermarket.service.WishlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ResponseEntity<List<WishlistItemDto>> getWishlist(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(wishlistService.getMyWishlist(principal.getName()));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<WishlistItemDto> addToWishlist(@PathVariable Long productId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(wishlistService.addToWishlist(productId, principal.getName()));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> removeFromWishlist(@PathVariable Long productId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        wishlistService.removeFromWishlist(productId, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{productId}/exists")
    public ResponseEntity<Map<String, Boolean>> checkWishlist(@PathVariable Long productId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        boolean exists = wishlistService.isWishlisted(productId, principal.getName());
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
