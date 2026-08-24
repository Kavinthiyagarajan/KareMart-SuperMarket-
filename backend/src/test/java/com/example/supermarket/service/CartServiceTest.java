package com.example.supermarket.service;

import com.example.supermarket.dto.CartResponseDto;
import com.example.supermarket.model.Cart;
import com.example.supermarket.model.CartItem;
import com.example.supermarket.model.Product;
import com.example.supermarket.model.User;
import com.example.supermarket.repository.CartRepository;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.example.supermarket.repository.OrderRepository orderRepository;

    @InjectMocks
    private CartService cartService;

    private User user;
    private Product product;
    private Cart cart;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        product = new Product();
        product.setId(10L);
        product.setActive(true);
        product.setAvailabilityStatus("IN_STOCK");
        product.setAvailableQuantity(50);

        cart = new Cart(user);
        cart.setId(1L);
        cart.setItems(new ArrayList<>());
    }

    @Test
    void testGetCart_ReturnsEmptyCart() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(cartRepository.findByUser(user)).thenReturn(Optional.empty());

        CartResponseDto result = cartService.getCart("testuser");
        assertTrue(result.items().isEmpty());
    }

    @Test
    void testAddItem_Success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        CartResponseDto result = cartService.addItem("testuser", 10L, 2);

        assertEquals(1, cart.getItems().size());
        assertEquals(2, cart.getItems().get(0).getQuantity());
        assertEquals(1, result.items().size());
    }

    @Test
    void testAddItem_ExceedsStock_ThrowsException() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        assertThrows(IllegalArgumentException.class, () -> {
            cartService.addItem("testuser", 10L, 60);
        });
    }

    @Test
    void testUpdateQuantity_Success() {
        CartItem item = new CartItem(cart, product, 2);
        cart.getItems().add(item);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));

        CartResponseDto result = cartService.updateQuantity("testuser", 10L, 10);

        assertEquals(10, cart.getItems().get(0).getQuantity());
    }

    @Test
    void testRemoveItem_Success() {
        CartItem item = new CartItem(cart, product, 2);
        cart.getItems().add(item);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));

        cartService.removeItem("testuser", 10L);

        assertTrue(cart.getItems().isEmpty());
    }

    @Test
    void testClearCart_Success() {
        CartItem item = new CartItem(cart, product, 2);
        cart.getItems().add(item);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));

        cartService.clearCart("testuser");

        assertTrue(cart.getItems().isEmpty());
    }

    @Test
    void testReorder_Success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        com.example.supermarket.repository.OrderRepository orderRepository = mock(com.example.supermarket.repository.OrderRepository.class);
        
        com.example.supermarket.model.Order order = new com.example.supermarket.model.Order();
        order.setCustomerId("testuser");
        order.setOrderNumber("ORD-123");
        
        com.example.supermarket.model.OrderItem orderItem = new com.example.supermarket.model.OrderItem();
        orderItem.setProduct(product);
        orderItem.setQuantity(5);
        order.getItems().add(orderItem);

        when(orderRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.of(order));
        when(cartRepository.findByUser(user)).thenReturn(Optional.of(cart));

        // Let's create a new CartService that uses this mocked orderRepository
        CartService testService = new CartService(cartRepository, productRepository, userRepository, orderRepository);

        com.example.supermarket.dto.ReorderResponseDto result = testService.reorder("testuser", "ORD-123");

        assertEquals(1, result.getItemsAdded());
        assertEquals(0, result.getItemsUnavailable());
        assertEquals(1, cart.getItems().size());
        assertEquals(5, cart.getItems().get(0).getQuantity());
    }
}
