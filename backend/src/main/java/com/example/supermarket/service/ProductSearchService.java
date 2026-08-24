package com.example.supermarket.service;

import com.example.supermarket.model.Product;
import com.example.supermarket.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ProductSearchService {
    private final ProductRepository productRepository;

    public ProductSearchService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Page<Product> searchProducts(String query, String category, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, String availabilityStatus, Pageable pageable) {
        String safeQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : "";
        String safeCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : "";
        String safeAvailability = (availabilityStatus != null && !availabilityStatus.trim().isEmpty()) ? availabilityStatus.trim() : "";
        
        return productRepository.searchProducts(safeQuery, safeCategory, minPrice, maxPrice, safeAvailability, pageable);
    }

    public Page<Product> getDeals(String category, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, String availabilityStatus, Pageable pageable) {
        String safeCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : "";
        String safeAvailability = (availabilityStatus != null && !availabilityStatus.trim().isEmpty()) ? availabilityStatus.trim() : "";
        
        return productRepository.findDeals(safeCategory, minPrice, maxPrice, safeAvailability, pageable);
    }
}
