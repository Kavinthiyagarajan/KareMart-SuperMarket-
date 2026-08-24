package com.example.supermarket.service;

import com.example.supermarket.dto.WishlistItemDto;
import com.example.supermarket.model.Product;
import com.example.supermarket.model.Role;
import com.example.supermarket.model.User;
import com.example.supermarket.model.WishlistItem;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.repository.UserRepository;
import com.example.supermarket.repository.WishlistItemRepository;
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
public class WishlistServiceTest {

    @Mock
    private WishlistItemRepository wishlistItemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private WishlistService wishlistService;

    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testUser = new User("customer1", "pass", Role.CUSTOMER);
        testUser.setId(1L);

        testProduct = new Product();
        testProduct.setId(10L);
        testProduct.setName("Test Product");
        testProduct.setSellingPrice(new java.math.BigDecimal("100.00"));
    }

    @Test
    void testGetMyWishlist() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        
        WishlistItem item = new WishlistItem(testUser, testProduct);
        item.setId(100L);
        when(wishlistItemRepository.findByUserOrderByCreatedAtDesc(testUser))
                .thenReturn(List.of(item));

        List<WishlistItemDto> result = wishlistService.getMyWishlist("customer1");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).product().getId());
    }

    @Test
    void testAddToWishlistSuccess() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(wishlistItemRepository.findByUserAndProductId(testUser, 10L)).thenReturn(Optional.empty());

        WishlistItem savedItem = new WishlistItem(testUser, testProduct);
        savedItem.setId(100L);
        when(wishlistItemRepository.save(any(WishlistItem.class))).thenReturn(savedItem);

        WishlistItemDto result = wishlistService.addToWishlist(10L, "customer1");

        assertNotNull(result);
        assertEquals(100L, result.id());
        assertEquals("Test Product", result.product().getName());
        verify(wishlistItemRepository, times(1)).save(any(WishlistItem.class));
    }

    @Test
    void testAddToWishlistDuplicate() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        
        WishlistItem existingItem = new WishlistItem(testUser, testProduct);
        existingItem.setId(100L);
        when(wishlistItemRepository.findByUserAndProductId(testUser, 10L)).thenReturn(Optional.of(existingItem));

        WishlistItemDto result = wishlistService.addToWishlist(10L, "customer1");

        assertNotNull(result);
        assertEquals(100L, result.id());
        // Verify save was NOT called since it's a duplicate
        verify(wishlistItemRepository, never()).save(any());
    }

    @Test
    void testRemoveFromWishlist() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        WishlistItem existingItem = new WishlistItem(testUser, testProduct);
        existingItem.setId(100L);
        
        when(wishlistItemRepository.findByUserAndProductId(testUser, 10L)).thenReturn(Optional.of(existingItem));

        wishlistService.removeFromWishlist(10L, "customer1");

        verify(wishlistItemRepository, times(1)).delete(existingItem);
    }

    @Test
    void testIsWishlisted() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(testUser));
        when(wishlistItemRepository.existsByUserAndProductId(testUser, 10L)).thenReturn(true);

        boolean result = wishlistService.isWishlisted(10L, "customer1");

        assertTrue(result);
    }
}
