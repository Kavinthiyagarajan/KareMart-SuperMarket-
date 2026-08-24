package com.example.supermarket.controller;

import com.example.supermarket.dto.ProductRequest;
import com.example.supermarket.dto.StockUpdateRequest;
import com.example.supermarket.model.Product;
import com.example.supermarket.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    private Product product;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setName("Test Product");
        product.setAvailableQuantity(10);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_AsAdmin_Success() throws Exception {
        when(productService.createProduct(any(ProductRequest.class))).thenReturn(product);

        String json = """
                {
                    "name": "Test Product",
                    "mrp": 120.0,
                    "sellingPrice": 100.0,
                    "availableQuantity": 10
                }
                """;

        mockMvc.perform(post("/api/v1/admin/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER") // Not admin
    void createProduct_AsUser_Forbidden() throws Exception {
        String json = """
                {
                    "name": "Test Product",
                    "mrp": 120.0,
                    "sellingPrice": 100.0,
                    "availableQuantity": 10
                }
                """;

        mockMvc.perform(post("/api/v1/admin/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateStock_AsAdmin_Success() throws Exception {
        when(productService.updateStock(eq(1L), any(StockUpdateRequest.class), anyString())).thenReturn(product);

        String json = """
                {
                    "operation": "ADD",
                    "amount": 5
                }
                """;

        mockMvc.perform(patch("/api/v1/admin/products/1/stock")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk());
    }
}
