package com.example.supermarket.controller;

import com.example.supermarket.dto.AdminOrderDetailsDto;
import com.example.supermarket.dto.AdminOrderSummaryDto;
import com.example.supermarket.model.Order;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import com.example.supermarket.service.DeliveryService;
import com.example.supermarket.service.InventoryReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderRepository orderRepository;

    @MockBean
    private PaymentRepository paymentRepository;

    @MockBean
    private DeliveryService deliveryService;

    @MockBean
    private InventoryReservationService inventoryReservationService;

    @MockBean
    private com.example.supermarket.service.NotificationService notificationService;

    private Order order;

    @BeforeEach
    void setUp() {
        order = new Order();
        order.setId(1L);
        order.setOrderNumber("ORD-123");
        order.setCustomerId("customer1");
        order.setStatus("CONFIRMED");
        order.setTotal(BigDecimal.TEN);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getOrders_AsAdmin_Success() throws Exception {
        Page<Order> page = new PageImpl<>(Collections.singletonList(order));
        when(orderRepository.searchOrders(any(), any(), any(Pageable.class))).thenReturn(page);
        when(paymentRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/admin/orders")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].orderNumber").value("ORD-123"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getOrders_AsUser_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/orders")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getOrderDetails_AsAdmin_Success() throws Exception {
        when(orderRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/admin/orders/ORD-123")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").value("ORD-123"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void cancelOrder_AsAdmin_Success() throws Exception {
        when(orderRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(patch("/api/v1/admin/orders/ORD-123/cancel")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void cancelOrder_AsUser_Forbidden() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/orders/ORD-123/cancel")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
