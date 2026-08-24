package com.example.supermarket.service;

import com.example.supermarket.dto.CartItemDto;
import com.example.supermarket.dto.CheckoutRequest;
import com.example.supermarket.dto.CheckoutResponse;
import com.example.supermarket.model.Product;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import com.example.supermarket.repository.AddressRepository;
import com.example.supermarket.repository.UserRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CheckoutServiceTest {

    private ProductRepository productRepository;
    private OrderRepository orderRepository;
    private CheckoutService checkoutService;
    private InventoryAuditService inventoryAuditService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        orderRepository = mock(OrderRepository.class);
        AddressRepository addressRepository = mock(AddressRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ServiceabilityService serviceabilityService = mock(ServiceabilityService.class);
        InventoryReservationService inventoryReservationService = mock(InventoryReservationService.class);
        PromotionService promotionService = mock(PromotionService.class);
        CartService cartService = mock(CartService.class);
        inventoryAuditService = mock(InventoryAuditService.class);
        checkoutService = new CheckoutService(productRepository, orderRepository, addressRepository, userRepository, serviceabilityService, inventoryReservationService, promotionService, cartService, inventoryAuditService);
    }

    @Test
    void validateCheckout_Success_CalculatesTotalsCorrectly() {
        // Arrange
        Product p1 = new Product();
        p1.setId(1L);
        p1.setAvailabilityStatus("IN_STOCK");
        p1.setAvailableQuantity(10);
        p1.setSellingPrice(new BigDecimal("100.00"));

        Product p2 = new Product();
        p2.setId(2L);
        p2.setAvailabilityStatus("IN_STOCK");
        p2.setAvailableQuantity(5);
        p2.setSellingPrice(new BigDecimal("50.00"));

        when(productRepository.findById(1L)).thenReturn(Optional.of(p1));
        when(productRepository.findById(2L)).thenReturn(Optional.of(p2));

        CheckoutRequest request = new CheckoutRequest(List.of(
                new CartItemDto(1L, 2), // 2 * 100 = 200
                new CartItemDto(2L, 1)  // 1 * 50 = 50
        ), null, null); // Subtotal = 250, Tax (5%) = 12.50, Total = 262.50

        // Act
        CheckoutResponse response = checkoutService.validateCheckout(request, "GUEST");

        // Assert
        assertTrue(response.success());
        assertNotNull(response.checkoutToken());
        assertEquals(0, response.errors().size());
        assertEquals(0, new BigDecimal("250.00").compareTo(response.subtotal()));
        assertEquals(0, new BigDecimal("12.50").compareTo(response.tax()));
        assertEquals(0, new BigDecimal("262.50").compareTo(response.total()));
    }

    @Test
    void validateCheckout_OutOfStock_FailsValidation() {
        // Arrange
        Product p1 = new Product();
        p1.setId(1L);
        p1.setAvailabilityStatus("OUT_OF_STOCK"); // Out of stock
        p1.setAvailableQuantity(0);
        p1.setSellingPrice(new BigDecimal("100.00"));

        when(productRepository.findById(1L)).thenReturn(Optional.of(p1));

        CheckoutRequest request = new CheckoutRequest(List.of(
                new CartItemDto(1L, 1)
        ), null, null);

        // Act
        CheckoutResponse response = checkoutService.validateCheckout(request, "GUEST");

        // Assert
        assertFalse(response.success());
        assertNull(response.checkoutToken());
        assertEquals(1, response.errors().size());
        assertEquals("OUT_OF_STOCK", response.errors().get(0).reason());
    }

    @Test
    void validateCheckout_QuantityExceeded_FailsValidation() {
        // Arrange
        Product p1 = new Product();
        p1.setId(1L);
        p1.setAvailabilityStatus("IN_STOCK");
        p1.setAvailableQuantity(2); // Only 2 available
        p1.setSellingPrice(new BigDecimal("100.00"));

        when(productRepository.findById(1L)).thenReturn(Optional.of(p1));

        CheckoutRequest request = new CheckoutRequest(List.of(
                new CartItemDto(1L, 5) // Requesting 5
        ), null, null);

        // Act
        CheckoutResponse response = checkoutService.validateCheckout(request, "GUEST");

        // Assert
        assertFalse(response.success());
        assertEquals(1, response.errors().size());
        assertEquals("QUANTITY_EXCEEDED", response.errors().get(0).reason());
    }
}
