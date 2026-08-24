package com.example.supermarket.integration.supermarket;

public record InventoryStatus(
    String externalId,
    Integer availableQuantity,
    String availabilityStatus
) {}
