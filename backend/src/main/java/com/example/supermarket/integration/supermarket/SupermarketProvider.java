package com.example.supermarket.integration.supermarket;

import java.util.List;
import java.util.Optional;

public interface SupermarketProvider {
    Optional<ExternalProduct> fetchProductDetails(String externalId);
    List<ExternalProduct> searchProducts(String query);
    InventoryStatus checkInventory(String externalId);
}
