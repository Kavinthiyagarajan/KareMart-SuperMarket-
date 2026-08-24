package com.example.supermarket.controller;

import com.example.supermarket.dto.AdminDashboardSummaryDto;
import com.example.supermarket.service.AdminDashboardService;
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
import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminDashboardService adminDashboardService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDashboardSummary_AsAdmin_Success() throws Exception {
        AdminDashboardSummaryDto mockDto = new AdminDashboardSummaryDto(
                new AdminDashboardSummaryDto.OrdersMetrics(100, 10, 80, 10),
                new AdminDashboardSummaryDto.SalesMetrics(new BigDecimal("1000.00"), new BigDecimal("100.00"), new BigDecimal("500.00")),
                new AdminDashboardSummaryDto.CustomersMetrics(50),
                new AdminDashboardSummaryDto.InventoryMetrics(200, 5, 2, Collections.emptyList()),
                new AdminDashboardSummaryDto.PaymentsMetrics(80, 5, 15),
                new AdminDashboardSummaryDto.DeliveryMetrics(80, 10, 60, 10),
                new AdminDashboardSummaryDto.CouponsMetrics(5, 20)
        );

        when(adminDashboardService.getDashboardSummary()).thenReturn(mockDto);

        mockMvc.perform(get("/api/v1/admin/dashboard/summary")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orders.total").value(100))
                .andExpect(jsonPath("$.sales.totalConfirmed").value(1000.00))
                .andExpect(jsonPath("$.inventory.activeProducts").value(200));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDashboardSummary_AsUser_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard/summary")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
