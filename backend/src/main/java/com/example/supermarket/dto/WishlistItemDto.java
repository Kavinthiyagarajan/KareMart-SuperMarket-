package com.example.supermarket.dto;

import com.example.supermarket.model.Product;
import com.example.supermarket.model.WishlistItem;

import java.time.ZonedDateTime;

public record WishlistItemDto(
        Long id,
        Product product,
        ZonedDateTime addedAt
) {
    public static WishlistItemDto from(WishlistItem item) {
        return new WishlistItemDto(
                item.getId(),
                item.getProduct(),
                item.getCreatedAt()
        );
    }
}
