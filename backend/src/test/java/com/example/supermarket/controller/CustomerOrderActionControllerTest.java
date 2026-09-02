package com.example.supermarket.controller;

import com.example.supermarket.dto.CancellationRequestDto;
import com.example.supermarket.dto.ReturnRequestDto;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.CancellationRequestRepository;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import com.example.supermarket.repository.ReturnRequestRepository;
import com.example.supermarket.service.CancellationService;
import com.example.supermarket.service.ReturnService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CustomerOrderActionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CancellationService cancellationService;

    @MockBean
    private ReturnService returnService;

    @MockBean
    private OrderRepository orderRepository;

    @MockBean
    private PaymentRepository paymentRepository;

    @MockBean
    private CancellationRequestRepository cancellationRequestRepository;

    @MockBean
    private ReturnRequestRepository returnRequestRepository;

    @Test
    @WithMockUser(username = "customer1", roles = "USER")
    void cancelOrder_AsCustomer_Success() throws Exception {
        CancellationRequestDto dto = new CancellationRequestDto(
                1L, "ORD-5001", "customer1", CancellationReason.CHANGED_MIND, "Notes",
                RequestStatus.COMPLETED, RefundStatus.NOT_REQUESTED, BigDecimal.ZERO,
                ZonedDateTime.now(), ZonedDateTime.now(), null, null, null
        );

        when(cancellationService.cancelOrder(eq("ORD-5001"), eq(CancellationReason.CHANGED_MIND), any(), eq("customer1")))
                .thenReturn(dto);

        mockMvc.perform(post("/api/v1/profile/orders/ORD-5001/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"CHANGED_MIND\",\"notes\":\"No longer needed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").value("ORD-5001"))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    @WithMockUser(username = "customer1", roles = "USER")
    void requestReturn_AsCustomer_Success() throws Exception {
        ReturnRequestDto dto = new ReturnRequestDto(
                10L, "ORD-5002", "customer1", ReturnReason.DAMAGED_INCORRECT_ITEM, "Damaged package",
                RequestStatus.PENDING, RefundStatus.REQUESTED, new BigDecimal("650.00"),
                ZonedDateTime.now(), ZonedDateTime.now(), null, null, null
        );

        when(returnService.requestReturn(eq("ORD-5002"), eq(ReturnReason.DAMAGED_INCORRECT_ITEM), any(), eq("customer1")))
                .thenReturn(dto);

        mockMvc.perform(post("/api/v1/profile/orders/ORD-5002/return")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"DAMAGED_INCORRECT_ITEM\",\"notes\":\"Damaged package\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").value("ORD-5002"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.refundStatus").value("REQUESTED"));
    }

    @Test
    @WithMockUser(username = "customer1", roles = "USER")
    void getOrderActionEligibility_Success() throws Exception {
        Order order = new Order();
        order.setOrderNumber("ORD-5003");
        order.setCustomerId("customer1");
        order.setStatus("DELIVERED");

        Payment payment = new Payment();
        payment.setStatus(PaymentStatus.SUCCESS);

        when(orderRepository.findByOrderNumber("ORD-5003")).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderNumber("ORD-5003")).thenReturn(Optional.of(payment));
        when(returnRequestRepository.findTopByOrderNumberOrderByCreatedAtDesc("ORD-5003")).thenReturn(Optional.empty());
        when(cancellationRequestRepository.findTopByOrderNumberOrderByCreatedAtDesc("ORD-5003")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/profile/orders/ORD-5003/actions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canCancel").value(false))
                .andExpect(jsonPath("$.canRequestReturn").value(true));
    }

    @Test
    void unauthenticatedAccess_Rejected() throws Exception {
        mockMvc.perform(post("/api/v1/profile/orders/ORD-5001/cancel"))
                .andExpect(status().isForbidden());
    }
}
