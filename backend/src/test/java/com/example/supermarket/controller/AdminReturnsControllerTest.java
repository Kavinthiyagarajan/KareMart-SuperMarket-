package com.example.supermarket.controller;

import com.example.supermarket.dto.CancellationRequestDto;
import com.example.supermarket.dto.ReturnRequestDto;
import com.example.supermarket.model.CancellationReason;
import com.example.supermarket.model.RefundStatus;
import com.example.supermarket.model.RequestStatus;
import com.example.supermarket.model.ReturnReason;
import com.example.supermarket.service.AdminReturnCancellationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

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
public class AdminReturnsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminReturnCancellationService adminReturnCancellationService;

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void getReturns_AsAdmin_Success() throws Exception {
        ReturnRequestDto dto = new ReturnRequestDto(
                1L, "ORD-6001", "user1", ReturnReason.DAMAGED_INCORRECT_ITEM, "Notes",
                RequestStatus.PENDING, RefundStatus.REQUESTED, new BigDecimal("450.00"),
                ZonedDateTime.now(), ZonedDateTime.now(), null, null, null
        );

        when(adminReturnCancellationService.searchReturns(any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/v1/admin/returns"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].orderNumber").value("ORD-6001"));
    }

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void reviewReturn_AsAdmin_Success() throws Exception {
        ReturnRequestDto dto = new ReturnRequestDto(
                1L, "ORD-6001", "user1", ReturnReason.DAMAGED_INCORRECT_ITEM, "Notes",
                RequestStatus.APPROVED, RefundStatus.APPROVED, new BigDecimal("450.00"),
                ZonedDateTime.now(), ZonedDateTime.now(), "admin1", ZonedDateTime.now(), "Approved"
        );

        when(adminReturnCancellationService.reviewReturn(eq(1L), eq(true), any(), eq("admin1")))
                .thenReturn(dto);

        mockMvc.perform(post("/api/v1/admin/returns/1/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approve\":true,\"adminNotes\":\"Approved\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.refundStatus").value("APPROVED"));
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void nonAdmin_CannotAccessAdminReturns() throws Exception {
        mockMvc.perform(get("/api/v1/admin/returns"))
                .andExpect(status().isForbidden());
    }
}
