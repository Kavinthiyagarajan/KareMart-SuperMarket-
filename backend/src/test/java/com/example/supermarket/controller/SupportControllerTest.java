package com.example.supermarket.controller;

import com.example.supermarket.dto.*;
import com.example.supermarket.model.ConversationStatus;
import com.example.supermarket.model.RequestType;
import com.example.supermarket.model.SenderType;
import com.example.supermarket.service.SupportChatService;
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

import java.time.ZonedDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SupportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SupportChatService supportChatService;

    @Test
    @WithMockUser(username = "customer1", roles = "USER")
    void getConversations_AsCustomer_Success() throws Exception {
        SupportConversationDto dto = new SupportConversationDto(
                1L, 10L, "customer1", "Item Availability", RequestType.PRODUCT_AVAILABILITY,
                null, null, null, ConversationStatus.OPEN, ZonedDateTime.now(), ZonedDateTime.now(), 1, null
        );
        when(supportChatService.getCustomerConversations(eq("customer1"), any()))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/v1/support/conversations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].subject").value("Item Availability"));
    }

    @Test
    @WithMockUser(username = "customer1", roles = "USER")
    void createConversation_AsCustomer_Success() throws Exception {
        SupportConversationDetailDto detailDto = new SupportConversationDetailDto(
                1L, 10L, "customer1", "Need Help", RequestType.OTHER,
                null, null, null, ConversationStatus.OPEN, ZonedDateTime.now(), ZonedDateTime.now(),
                List.of(new SupportMessageDto(100L, 1L, SenderType.CUSTOMER, "customer1", "Hello", null, null, ZonedDateTime.now()))
        );
        when(supportChatService.createConversation(eq("customer1"), any()))
                .thenReturn(detailDto);

        mockMvc.perform(post("/api/v1/support/conversations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                            "subject": "Need Help",
                            "requestType": "OTHER",
                            "message": "Hello"
                        }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subject").value("Need Help"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void adminEndpoints_AsCustomer_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/support/conversations"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void adminEndpoints_AsAdmin_Success() throws Exception {
        SupportConversationDto dto = new SupportConversationDto(
                1L, 10L, "customer1", "Admin Inquiry", RequestType.PRODUCT_REQUEST,
                null, null, null, ConversationStatus.OPEN, ZonedDateTime.now(), ZonedDateTime.now(), 1, null
        );
        when(supportChatService.getAdminConversations(any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/v1/admin/support/conversations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].subject").value("Admin Inquiry"));
    }
}
