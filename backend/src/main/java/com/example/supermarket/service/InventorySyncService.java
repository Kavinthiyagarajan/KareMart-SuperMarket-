package com.example.supermarket.service;

import com.example.supermarket.integration.supermarket.ExternalProduct;
import com.example.supermarket.integration.supermarket.SupermarketProvider;
import com.example.supermarket.model.Category;
import com.example.supermarket.model.Product;
import com.example.supermarket.repository.CategoryRepository;
import com.example.supermarket.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.Optional;

@Service
public class InventorySyncService {
    private final SupermarketProvider supermarketProvider;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final PriceHistoryService priceHistoryService;

    public InventorySyncService(SupermarketProvider supermarketProvider,
                                ProductRepository productRepository,
                                CategoryRepository categoryRepository,
                                PriceHistoryService priceHistoryService) {
        this.supermarketProvider = supermarketProvider;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.priceHistoryService = priceHistoryService;
    }

    @Transactional
    public Product syncProduct(String externalId) {
        Optional<ExternalProduct> externalOpt = supermarketProvider.fetchProductDetails(externalId);
        
        if (externalOpt.isEmpty()) {
            throw new RuntimeException("Product not found in partner system");
        }
        
        ExternalProduct ext = externalOpt.get();
        
        // Find or Create Category
        Category category = null;
        if (ext.categoryName() != null) {
            String catSlug = ext.categoryName().toLowerCase().replace(" ", "-");
            category = categoryRepository.findBySlug(catSlug).orElseGet(() -> {
                Category c = new Category();
                c.setName(ext.categoryName());
                c.setSlug(catSlug);
                return categoryRepository.save(c);
            });
        }

        // Find or Create Product
        Product product = productRepository.findByExternalId(ext.externalId()).orElseGet(Product::new);
        
        product.setExternalId(ext.externalId());
        product.setSku(ext.sku());
        product.setBarcode(ext.barcode());
        product.setName(ext.name());
        product.setSlug(ext.name().toLowerCase().replace(" ", "-") + "-" + ext.externalId().toLowerCase());
        product.setBrand(ext.brand());
        product.setCategory(category);
        product.setImageUrl(ext.imageUrl());
        product.setMrp(ext.mrp());
        product.setSellingPrice(ext.sellingPrice());
        product.setDiscountPercent(ext.discountPercent());
        product.setAvailableQuantity(ext.availableQuantity());
        product.setAvailabilityStatus(ext.availabilityStatus());
        product.setUnit(ext.unit());
        product.setSource("PARTNER_API");
        product.setLastSyncedAt(ZonedDateTime.now());
        
        Product savedProduct = productRepository.save(product);
        
        // Record price history
        priceHistoryService.recordPriceChange(savedProduct, "PARTNER_API");
        
        return savedProduct;
    }
}
