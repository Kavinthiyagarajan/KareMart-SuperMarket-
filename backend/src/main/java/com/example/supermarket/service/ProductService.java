package com.example.supermarket.service;

import com.example.supermarket.model.Product;
import com.example.supermarket.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.Optional;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final InventoryAuditService inventoryAuditService;

    public ProductService(ProductRepository productRepository, InventoryAuditService inventoryAuditService) {
        this.productRepository = productRepository;
        this.inventoryAuditService = inventoryAuditService;
    }

    public Page<Product> getProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending().and(Sort.by("id").ascending()));
        return productRepository.findByActiveTrue(pageable);
    }

    public Page<Product> getProductsAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending().and(Sort.by("id").ascending()));
        return productRepository.findAll(pageable);
    }

    public Optional<Product> getProductBySlug(String slug) {
        return productRepository.findBySlug(slug);
    }

    @org.springframework.transaction.annotation.Transactional
    public Product createProduct(com.example.supermarket.dto.ProductRequest request) {
        if (request.name() == null || request.name().trim().isEmpty()) throw new IllegalArgumentException("Name cannot be empty");
        if (request.sellingPrice() == null || request.sellingPrice().compareTo(java.math.BigDecimal.ZERO) < 0) throw new IllegalArgumentException("Invalid price");
        if (request.availableQuantity() == null || request.availableQuantity() < 0) throw new IllegalArgumentException("Invalid stock");

        Product product = new Product();
        product.setName(request.name().trim());
        product.setSlug(request.name().toLowerCase().replaceAll("[^a-z0-9]+", "-"));
        product.setExternalId(java.util.UUID.randomUUID().toString());
        product.setSku(request.sku());
        product.setBarcode(request.barcode());
        product.setBrand(request.brand());
        product.setImageUrl(request.imageUrl());
        product.setMrp(request.mrp() != null ? request.mrp() : request.sellingPrice());
        product.setSellingPrice(request.sellingPrice());
        product.setAvailableQuantity(request.availableQuantity());
        product.setAvailabilityStatus(request.availableQuantity() > 0 ? "IN_STOCK" : "OUT_OF_STOCK");
        product.setUnit(request.unit());
        product.setSource("ADMIN");
        product.setActive(true);
        // We will skip category fetching for simplicity or assume it's null unless fetched

        return productRepository.save(product);
    }

    @org.springframework.transaction.annotation.Transactional
    public Product updateProduct(Long id, com.example.supermarket.dto.ProductRequest request) {
        Product product = productRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        if (request.name() != null && !request.name().trim().isEmpty()) {
            product.setName(request.name().trim());
            product.setSlug(request.name().toLowerCase().replaceAll("[^a-z0-9]+", "-"));
        }
        if (request.sku() != null) product.setSku(request.sku());
        if (request.barcode() != null) product.setBarcode(request.barcode());
        if (request.brand() != null) product.setBrand(request.brand());
        if (request.imageUrl() != null) product.setImageUrl(request.imageUrl());
        if (request.mrp() != null) product.setMrp(request.mrp());
        if (request.sellingPrice() != null && request.sellingPrice().compareTo(java.math.BigDecimal.ZERO) >= 0) {
            product.setSellingPrice(request.sellingPrice());
        }
        if (request.unit() != null) product.setUnit(request.unit());

        return productRepository.save(product);
    }

    @org.springframework.transaction.annotation.Transactional
    public Product toggleProductStatus(Long id, boolean active) {
        Product product = productRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Product not found"));
        product.setActive(active);
        return productRepository.save(product);
    }

    @org.springframework.transaction.annotation.Transactional
    public Product updateStock(Long id, com.example.supermarket.dto.StockUpdateRequest request, String username) {
        Product product = productRepository.findByIdForUpdate(id).orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        if (request.amount() == null || request.amount() < 0) {
             throw new IllegalArgumentException("Invalid amount");
        }

        int currentStock = product.getAvailableQuantity();
        int newStock;
        com.example.supermarket.model.TransactionType type;
        int quantityChange;

        switch (request.operation().toUpperCase()) {
            case "SET":
                newStock = request.amount();
                quantityChange = newStock - currentStock;
                type = com.example.supermarket.model.TransactionType.ADMIN_SET;
                break;
            case "ADD":
                newStock = currentStock + request.amount();
                quantityChange = request.amount();
                type = com.example.supermarket.model.TransactionType.ADMIN_ADD;
                break;
            case "SUBTRACT":
                newStock = currentStock - request.amount();
                quantityChange = -request.amount();
                if (newStock < 0) throw new IllegalArgumentException("Stock cannot be negative");
                type = com.example.supermarket.model.TransactionType.ADMIN_SUBTRACT;
                break;
            default:
                throw new IllegalArgumentException("Invalid operation");
        }

        product.setAvailableQuantity(newStock);
        product.setAvailabilityStatus(newStock > 0 ? "IN_STOCK" : "OUT_OF_STOCK");

        Product savedProduct = productRepository.save(product);
        
        inventoryAuditService.recordAudit(savedProduct, quantityChange, currentStock, newStock, type, "Admin stock update", null, username);
        
        return savedProduct;
    }
}
