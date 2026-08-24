package com.example.supermarket.service;

import com.example.supermarket.model.Product;
import com.example.supermarket.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;

public class ProductSearchServiceTest {

    private ProductRepository productRepository;
    private ProductSearchService productSearchService;

    @BeforeEach
    public void setup() {
        productRepository = Mockito.mock(ProductRepository.class);
        productSearchService = new ProductSearchService(productRepository);
    }

    @Test
    public void testSearchProducts_EmptyQuery() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Product> mockPage = new PageImpl<>(Collections.emptyList());
        Mockito.when(productRepository.searchProducts("", "", null, null, "", pageable)).thenReturn(mockPage);

        Page<Product> result = productSearchService.searchProducts("   ", null, null, null, null, pageable);

        assertEquals(mockPage, result);
        Mockito.verify(productRepository).searchProducts("", "", null, null, "", pageable);
    }

    @Test
    public void testSearchProducts_ValidQuery() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Product> mockPage = new PageImpl<>(Collections.emptyList());
        Mockito.when(productRepository.searchProducts(eq("milk"), eq(""), eq(null), eq(null), eq(""), eq(pageable))).thenReturn(mockPage);

        Page<Product> result = productSearchService.searchProducts("  milk  ", null, null, null, null, pageable);

        assertEquals(mockPage, result);
        Mockito.verify(productRepository).searchProducts("milk", "", null, null, "", pageable);
    }

    @Test
    public void testSearchProducts_WithFilters() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Product> mockPage = new PageImpl<>(Collections.emptyList());
        java.math.BigDecimal minPrice = new java.math.BigDecimal("10.00");
        java.math.BigDecimal maxPrice = new java.math.BigDecimal("50.00");

        Mockito.when(productRepository.searchProducts(eq("milk"), eq("dairy"), eq(minPrice), eq(maxPrice), eq("IN_STOCK"), eq(pageable)))
                .thenReturn(mockPage);

        Page<Product> result = productSearchService.searchProducts("milk", "  dairy  ", minPrice, maxPrice, " IN_STOCK ", pageable);

        assertEquals(mockPage, result);
        Mockito.verify(productRepository).searchProducts("milk", "dairy", minPrice, maxPrice, "IN_STOCK", pageable);
    }
}
