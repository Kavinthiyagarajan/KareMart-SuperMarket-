package com.example.supermarket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ProductRequest(
    @NotBlank(message = "Name is required") String name,
    String description,
    String sku,
    String barcode,
    String brand,
    Long categoryId,
    String imageUrl,
    @NotNull(message = "MRP is required") BigDecimal mrp,
    @NotNull(message = "Selling price is required") BigDecimal sellingPrice,
    Integer availableQuantity,
    String unit
) {}
