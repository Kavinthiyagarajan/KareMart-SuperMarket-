package com.example.supermarket.integration.supermarket;

import java.math.BigDecimal;

public record ExternalProduct(
    String externalId,
    String sku,
    String barcode,
    String name,
    String brand,
    String categoryName,
    String imageUrl,
    BigDecimal mrp,
    BigDecimal sellingPrice,
    BigDecimal discountPercent,
    Integer availableQuantity,
    String availabilityStatus,
    String unit
) {}
