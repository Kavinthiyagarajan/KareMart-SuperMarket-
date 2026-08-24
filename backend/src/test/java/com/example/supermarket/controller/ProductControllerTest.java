package com.example.supermarket.controller;

import com.example.supermarket.model.Product;
import com.example.supermarket.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;

import com.example.supermarket.service.ProductSearchService;

public class ProductControllerTest {

    private ProductService productService;
    private ProductSearchService productSearchService;
    private com.example.supermarket.repository.OrderItemRepository orderItemRepository;
    private com.example.supermarket.repository.ProductRepository productRepository;
    private ProductController productController;

    @BeforeEach
    public void setup() {
        productService = Mockito.mock(ProductService.class);
        productSearchService = Mockito.mock(ProductSearchService.class);
        orderItemRepository = Mockito.mock(com.example.supermarket.repository.OrderItemRepository.class);
        productRepository = Mockito.mock(com.example.supermarket.repository.ProductRepository.class);
        productController = new ProductController(productService, productSearchService, orderItemRepository, productRepository);
    }

    @Test
    public void testGetProducts_DefaultPagination() {
        Page<Product> mockPage = new PageImpl<>(Collections.emptyList());
        Mockito.when(productService.getProducts(eq(0), eq(20))).thenReturn(mockPage);

        Page<Product> result = productController.getProducts(0, 20);

        assertEquals(mockPage, result);
        Mockito.verify(productService).getProducts(0, 20);
    }

    @Test
    public void testGetProducts_CustomPagination() {
        Page<Product> mockPage = new PageImpl<>(Collections.emptyList());
        Mockito.when(productService.getProducts(eq(2), eq(10))).thenReturn(mockPage);

        Page<Product> result = productController.getProducts(2, 10);

        assertEquals(mockPage, result);
        Mockito.verify(productService).getProducts(2, 10);
    }

    @Test
    public void testGetProducts_MaxPageSizeEnforcement() {
        Page<Product> mockPage = new PageImpl<>(Collections.emptyList());
        // Requested size 100 should be capped to 50
        Mockito.when(productService.getProducts(eq(0), eq(50))).thenReturn(mockPage);

        Page<Product> result = productController.getProducts(0, 100);

        assertEquals(mockPage, result);
        Mockito.verify(productService).getProducts(0, 50);
    }
}
