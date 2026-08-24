package com.example.supermarket.service;

import com.example.supermarket.dto.CartItemResponseDto;
import com.example.supermarket.dto.CartResponseDto;
import com.example.supermarket.model.Cart;
import com.example.supermarket.model.CartItem;
import com.example.supermarket.model.Product;
import com.example.supermarket.model.User;
import com.example.supermarket.repository.CartRepository;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final com.example.supermarket.repository.OrderRepository orderRepository;

    public CartService(CartRepository cartRepository, ProductRepository productRepository, UserRepository userRepository, com.example.supermarket.repository.OrderRepository orderRepository) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user).orElseGet(() -> {
            Cart newCart = new Cart(user);
            return cartRepository.save(newCart);
        });
    }

    @Transactional(readOnly = true)
    public CartResponseDto getCart(String username) {
        User user = getUserByUsername(username);
        Cart cart = cartRepository.findByUser(user).orElse(null);
        if (cart == null) {
            return new CartResponseDto(java.util.Collections.emptyList());
        }
        return new CartResponseDto(
                cart.getItems().stream()
                        .map(item -> new CartItemResponseDto(item.getProduct(), item.getQuantity()))
                        .toList()
        );
    }

    @Transactional
    public CartResponseDto addItem(String username, Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        User user = getUserByUsername(username);
        Cart cart = getOrCreateCart(user);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (!product.getActive()) {
            throw new IllegalArgumentException("Product is not active");
        }
        if (!"IN_STOCK".equals(product.getAvailabilityStatus())) {
            throw new IllegalArgumentException("Product is out of stock");
        }

        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + quantity;
            if (newQuantity > product.getAvailableQuantity()) {
                throw new IllegalArgumentException("Quantity exceeds available stock");
            }
            existingItem.setQuantity(newQuantity);
        } else {
            if (quantity > product.getAvailableQuantity()) {
                throw new IllegalArgumentException("Quantity exceeds available stock");
            }
            CartItem newItem = new CartItem(cart, product, quantity);
            cart.addItem(newItem);
        }

        cartRepository.save(cart);
        return getCart(username);
    }

    @Transactional
    public CartResponseDto updateQuantity(String username, Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        User user = getUserByUsername(username);
        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));

        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Product not in cart"));

        if (quantity > existingItem.getProduct().getAvailableQuantity()) {
            throw new IllegalArgumentException("Quantity exceeds available stock");
        }

        existingItem.setQuantity(quantity);
        cartRepository.save(cart);
        return getCart(username);
    }

    @Transactional
    public CartResponseDto removeItem(String username, Long productId) {
        User user = getUserByUsername(username);
        cartRepository.findByUser(user).ifPresent(cart -> {
            cart.getItems().removeIf(item -> item.getProduct().getId().equals(productId));
            cartRepository.save(cart);
        });
        return getCart(username);
    }

    @Transactional
    public void clearCart(String username) {
        User user = getUserByUsername(username);
        cartRepository.findByUser(user).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepository.save(cart);
        });
    }

    @Transactional
    public com.example.supermarket.dto.ReorderResponseDto reorder(String username, String orderNumber) {
        User user = getUserByUsername(username);
        com.example.supermarket.model.Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getCustomerId().equals(username)) {
            throw new IllegalArgumentException("Unauthorized");
        }

        Cart cart = getOrCreateCart(user);
        int itemsAdded = 0;
        int itemsUnavailable = 0;
        java.util.List<String> unavailableProductNames = new java.util.ArrayList<>();

        for (com.example.supermarket.model.OrderItem orderItem : order.getItems()) {
            Product product = orderItem.getProduct();
            
            if (!Boolean.TRUE.equals(product.getActive()) || !"IN_STOCK".equals(product.getAvailabilityStatus()) || product.getAvailableQuantity() <= 0) {
                itemsUnavailable++;
                unavailableProductNames.add(product.getName());
                continue;
            }

            int requestedQuantity = orderItem.getQuantity();
            int addQuantity = Math.min(requestedQuantity, product.getAvailableQuantity());

            Optional<CartItem> existingItemOpt = cart.getItems().stream()
                    .filter(item -> item.getProduct().getId().equals(product.getId()))
                    .findFirst();

            if (existingItemOpt.isPresent()) {
                CartItem existingItem = existingItemOpt.get();
                int newQuantity = existingItem.getQuantity() + addQuantity;
                if (newQuantity > product.getAvailableQuantity()) {
                    newQuantity = product.getAvailableQuantity();
                }
                if (newQuantity > existingItem.getQuantity()) {
                    existingItem.setQuantity(newQuantity);
                    itemsAdded++;
                } else {
                    // Already maxed out
                    itemsUnavailable++;
                    unavailableProductNames.add(product.getName());
                }
            } else {
                CartItem newItem = new CartItem(cart, product, addQuantity);
                cart.addItem(newItem);
                itemsAdded++;
            }
        }

        cartRepository.save(cart);
        return new com.example.supermarket.dto.ReorderResponseDto(itemsAdded, itemsUnavailable, unavailableProductNames);
    }
}
