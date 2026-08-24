package com.example.supermarket.controller;

import com.example.supermarket.model.Product;
import com.example.supermarket.service.ProductService;
import com.example.supermarket.service.ProductSearchService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductService productService;
    private final ProductSearchService productSearchService;
    private final com.example.supermarket.repository.OrderItemRepository orderItemRepository;
    private final com.example.supermarket.repository.ProductRepository productRepository;

    public ProductController(ProductService productService, ProductSearchService productSearchService,
                             com.example.supermarket.repository.OrderItemRepository orderItemRepository,
                             com.example.supermarket.repository.ProductRepository productRepository) {
        this.productService = productService;
        this.productSearchService = productSearchService;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/search")
    public Page<Product> searchProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) String availability,
            @RequestParam(defaultValue = "relevance") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (size > 50) {
            size = 50;
        }

        Sort pageSort;
        switch (sort) {
            case "nameAsc":
                pageSort = Sort.by("name").ascending().and(Sort.by("id").ascending());
                break;
            case "priceAsc":
                pageSort = Sort.by("sellingPrice").ascending().and(Sort.by("id").ascending());
                break;
            case "priceDesc":
                pageSort = Sort.by("sellingPrice").descending().and(Sort.by("id").ascending());
                break;
            case "relevance":
            default:
                pageSort = Sort.by("name").ascending().and(Sort.by("id").ascending());
                break;
        }

        Pageable pageable = PageRequest.of(page, size, pageSort);
        return productSearchService.searchProducts(q, category, minPrice, maxPrice, availability, pageable);
    }

    @GetMapping("/deals")
    public Page<Product> getDeals(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) String availability,
            @RequestParam(defaultValue = "relevance") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (size > 50) {
            size = 50;
        }

        Sort pageSort;
        switch (sort) {
            case "nameAsc":
                pageSort = Sort.by("name").ascending().and(Sort.by("id").ascending());
                break;
            case "priceAsc":
                pageSort = Sort.by("sellingPrice").ascending().and(Sort.by("id").ascending());
                break;
            case "priceDesc":
                pageSort = Sort.by("sellingPrice").descending().and(Sort.by("id").ascending());
                break;
            case "discountDesc":
                pageSort = Sort.by("discountPercent").descending().and(Sort.by("id").ascending());
                break;
            case "relevance":
            default:
                pageSort = Sort.by("discountPercent").descending().and(Sort.by("name").ascending());
                break;
        }

        Pageable pageable = PageRequest.of(page, size, pageSort);
        return productSearchService.getDeals(category, minPrice, maxPrice, availability, pageable);
    }

    @GetMapping
    public Page<Product> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (size > 50) {
            size = 50;
        }
        return productService.getProducts(page, size);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Product> getProductBySlug(@PathVariable String slug) {
        return productService.getProductBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{productId}/related")
    public ResponseEntity<java.util.List<Product>> getRelatedProducts(@PathVariable Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || product.getCategory() == null) return ResponseEntity.ok(java.util.List.of());

        Pageable limit = PageRequest.of(0, 4);
        java.util.List<Product> related = productRepository.findRelatedProducts(product.getCategory().getId(), productId, limit);
        return ResponseEntity.ok(related);
    }

    @GetMapping("/popular")
    public ResponseEntity<java.util.List<Product>> getPopularProducts() {
        Pageable limit = PageRequest.of(0, 8);
        java.util.List<Long> productIds = orderItemRepository.findPopularProductIds(java.util.List.of("CONFIRMED", "DELIVERED"), limit);
        
        if (productIds.isEmpty()) return ResponseEntity.ok(java.util.List.of());
        
        java.util.List<Product> products = productRepository.findByIdIn(productIds);
        
        java.util.Map<Long, Product> productMap = new java.util.HashMap<>();
        for (Product p : products) productMap.put(p.getId(), p);
        
        java.util.List<Product> sortedProducts = new java.util.ArrayList<>();
        for (Long id : productIds) {
            Product p = productMap.get(id);
            if (p != null && Boolean.TRUE.equals(p.getActive()) && "IN_STOCK".equals(p.getAvailabilityStatus())) {
                sortedProducts.add(p);
            }
        }
        
        return ResponseEntity.ok(sortedProducts);
    }
}
