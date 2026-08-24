package com.example.supermarket.controller;

import com.example.supermarket.model.Order;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import com.example.supermarket.service.DeliveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class ProfileControllerTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private DeliveryService deliveryService;

    @Mock
    private com.example.supermarket.repository.OrderItemRepository orderItemRepository;

    @Mock
    private com.example.supermarket.repository.ProductRepository productRepository;

    @InjectMocks
    private ProfileController profileController;

    private Principal principal;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        principal = mock(Principal.class);
        when(principal.getName()).thenReturn("test_user");
    }

    @Test
    void getMyOrders_returnsPaginatedOrders() {
        Order order = new Order();
        order.setOrderNumber("ORD-123");
        order.setStatus("CONFIRMED");
        order.setTotal(java.math.BigDecimal.TEN);
        order.setCreatedAt(ZonedDateTime.now());

        Page<Order> page = new PageImpl<>(List.of(order));
        when(orderRepository.findByCustomerIdOrderByIdDesc(eq("test_user"), any(PageRequest.class))).thenReturn(page);

        ResponseEntity<Page<com.example.supermarket.dto.OrderSummaryDto>> response = profileController.getMyOrders(0, 20, principal);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, response.getBody().getContent().size());
        assertEquals("ORD-123", response.getBody().getContent().get(0).orderNumber());
    }

    @Test
    void getOrderDetails_returnsForbiddenIfWrongUser() {
        Order order = new Order();
        order.setOrderNumber("ORD-123");
        order.setCustomerId("another_user");

        when(orderRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.of(order));

        ResponseEntity<com.example.supermarket.dto.OrderDetailsDto> response = profileController.getOrderDetails("ORD-123", principal);

        assertEquals(403, response.getStatusCode().value());
    }

    @Test
    void getOrderDetails_returnsOrderDetailsForOwner() {
        Order order = new Order();
        order.setOrderNumber("ORD-123");
        order.setCustomerId("test_user");
        order.setStatus("CONFIRMED");
        order.setSubtotal(java.math.BigDecimal.TEN);
        order.setTax(java.math.BigDecimal.ZERO);
        order.setTotal(java.math.BigDecimal.TEN);
        order.setCreatedAt(ZonedDateTime.now());

        when(orderRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.empty());

        ResponseEntity<com.example.supermarket.dto.OrderDetailsDto> response = profileController.getOrderDetails("ORD-123", principal);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("ORD-123", response.getBody().orderNumber());
    }
}
