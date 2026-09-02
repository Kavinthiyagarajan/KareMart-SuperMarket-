package com.example.supermarket.integration.supermarket;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Component
public class MockSupermarketProvider implements SupermarketProvider {

    public static final List<ExternalProduct> MOCK_PRODUCTS = List.of(
        // Staples
        new ExternalProduct("EXT-101", "SKU-101", "123456789001", "Premium Basmati Rice", "Royal Harvest", "Staples", "https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=500&q=80", new BigDecimal("350.00"), new BigDecimal("320.00"), new BigDecimal("8.57"), 90, "IN_STOCK", "1 kg"),
        new ExternalProduct("EXT-102", "SKU-102", "123456789002", "Whole Wheat Atta", "Nature's Best", "Staples", "https://images.unsplash.com/photo-1627485937980-221c88ce04ea?w=500&q=80", new BigDecimal("250.00"), new BigDecimal("220.00"), new BigDecimal("12.00"), 100, "IN_STOCK", "5 kg"),
        new ExternalProduct("EXT-103", "SKU-103", "123456789003", "Refined Sugar", "Sweet Crystal", "Staples", "https://images.unsplash.com/photo-1581452934440-272e2db1ec9e?w=500&q=80", new BigDecimal("55.00"), new BigDecimal("50.00"), new BigDecimal("9.09"), 200, "IN_STOCK", "1 kg"),
        new ExternalProduct("EXT-125", "SKU-125", "123456789025", "Organic Brown Rice", "Earth Organics", "Staples", "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&q=80", new BigDecimal("280.00"), new BigDecimal("280.00"), BigDecimal.ZERO, 45, "IN_STOCK", "1 kg"),

        // Snacks
        new ExternalProduct("EXT-104", "SKU-104", "123456789004", "Potato Chips - Salted", "Crunchy Snacks", "Snacks", "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80", new BigDecimal("20.00"), new BigDecimal("20.00"), BigDecimal.ZERO, 200, "IN_STOCK", "50g"),
        new ExternalProduct("EXT-105", "SKU-105", "123456789005", "Spicy Nachos", "Crunchy Snacks", "Snacks", "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&q=80", new BigDecimal("85.00"), new BigDecimal("75.00"), new BigDecimal("11.76"), 150, "IN_STOCK", "150g"),
        new ExternalProduct("EXT-126", "SKU-126", "123456789026", "Roasted Salted Peanuts", "Nutty Delights", "Snacks", "https://images.unsplash.com/photo-1567892339599-2810454378f4?w=500&q=80", new BigDecimal("60.00"), new BigDecimal("55.00"), new BigDecimal("8.33"), 90, "IN_STOCK", "200g"),

        // Biscuits
        new ExternalProduct("EXT-106", "SKU-106", "123456789006", "Chocolate Chip Cookies", "Sweet Treats", "Biscuits", "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80", new BigDecimal("120.00"), new BigDecimal("100.00"), new BigDecimal("16.66"), 60, "IN_STOCK", "150g"),
        new ExternalProduct("EXT-107", "SKU-107", "123456789007", "Digestive Biscuits", "Healthy Bake", "Biscuits", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80", new BigDecimal("40.00"), new BigDecimal("35.00"), new BigDecimal("12.50"), 100, "IN_STOCK", "250g"),
        new ExternalProduct("EXT-127", "SKU-127", "123456789027", "Butter Cookies Pack", "Sweet Treats", "Biscuits", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80", new BigDecimal("85.00"), new BigDecimal("85.00"), BigDecimal.ZERO, 0, "OUT_OF_STOCK", "200g"),

        // Beverages
        new ExternalProduct("EXT-108", "SKU-108", "123456789008", "Assam Tea Leaves", "Morning Brew", "Beverages", "https://images.unsplash.com/photo-1576092762791-dd9e2220abd4?w=500&q=80", new BigDecimal("250.00"), new BigDecimal("230.00"), new BigDecimal("8.00"), 80, "IN_STOCK", "500g"),
        new ExternalProduct("EXT-109", "SKU-109", "123456789009", "Instant Coffee Jar", "Bean Buzz", "Beverages", "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&q=80", new BigDecimal("350.00"), new BigDecimal("310.00"), new BigDecimal("11.42"), 60, "IN_STOCK", "200g"),
        new ExternalProduct("EXT-110", "SKU-110", "123456789010", "Sparkling Water", "Aqua Pure", "Beverages", "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&q=80", new BigDecimal("40.00"), new BigDecimal("35.00"), new BigDecimal("12.50"), 120, "IN_STOCK", "500 ml"),
        new ExternalProduct("EXT-128", "SKU-128", "123456789028", "Packaged Mixed Fruit Juice", "Fruit Splash", "Beverages", "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80", new BigDecimal("120.00"), new BigDecimal("110.00"), new BigDecimal("8.33"), 0, "OUT_OF_STOCK", "1 L"),
        new ExternalProduct("EXT-129", "SKU-129", "123456789029", "Packaged Mango Drink", "Fruit Splash", "Beverages", "https://images.unsplash.com/photo-1546173159-315724a31696?w=500&q=80", new BigDecimal("75.00"), new BigDecimal("75.00"), BigDecimal.ZERO, 85, "IN_STOCK", "1 L"),

        // Breakfast
        new ExternalProduct("EXT-111", "SKU-111", "123456789011", "Corn Flakes", "Morning Crunch", "Breakfast", "https://images.unsplash.com/photo-1521404176465-b1a9c37021dc?w=500&q=80", new BigDecimal("180.00"), new BigDecimal("160.00"), new BigDecimal("11.11"), 70, "IN_STOCK", "500g"),
        new ExternalProduct("EXT-112", "SKU-112", "123456789012", "Oats Pouch", "Healthy Start", "Breakfast", "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=500&q=80", new BigDecimal("150.00"), new BigDecimal("130.00"), new BigDecimal("13.33"), 50, "IN_STOCK", "1 kg"),
        new ExternalProduct("EXT-113", "SKU-113", "123456789013", "Peanut Butter", "Nutty Delights", "Breakfast", "https://images.unsplash.com/photo-1584897008892-0b1a03058a5c?w=500&q=80", new BigDecimal("300.00"), new BigDecimal("270.00"), new BigDecimal("10.00"), 40, "IN_STOCK", "500g"),
        new ExternalProduct("EXT-130", "SKU-130", "123456789030", "Honey Crunchy Muesli", "Healthy Start", "Breakfast", "https://images.unsplash.com/photo-1517093707765-a8904f56f8f5?w=500&q=80", new BigDecimal("320.00"), new BigDecimal("320.00"), BigDecimal.ZERO, 3, "LOW_STOCK", "400g"),

        // Cooking Essentials
        new ExternalProduct("EXT-114", "SKU-114", "123456789014", "Refined Sunflower Oil", "Golden Drops", "Cooking Essentials", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80", new BigDecimal("180.00"), new BigDecimal("165.00"), new BigDecimal("8.33"), 100, "IN_STOCK", "1 L"),
        new ExternalProduct("EXT-115", "SKU-115", "123456789015", "Iodized Salt", "Pure White", "Cooking Essentials", "https://images.unsplash.com/photo-1610444391696-6515822ee405?w=500&q=80", new BigDecimal("25.00"), new BigDecimal("22.00"), new BigDecimal("12.00"), 300, "IN_STOCK", "1 kg"),
        new ExternalProduct("EXT-131", "SKU-131", "123456789031", "Turmeric Powder", "Pure Spice", "Cooking Essentials", "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&q=80", new BigDecimal("80.00"), new BigDecimal("75.00"), new BigDecimal("6.25"), 120, "IN_STOCK", "200g"),
        new ExternalProduct("EXT-132", "SKU-132", "123456789032", "Red Chilli Powder", "Pure Spice", "Cooking Essentials", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80", new BigDecimal("95.00"), new BigDecimal("90.00"), new BigDecimal("5.26"), 110, "IN_STOCK", "200g"),
        new ExternalProduct("EXT-133", "SKU-133", "123456789033", "Pure Mustard Oil", "Golden Drops", "Cooking Essentials", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80", new BigDecimal("210.00"), new BigDecimal("210.00"), BigDecimal.ZERO, 4, "LOW_STOCK", "1 L"),

        // Instant Foods
        new ExternalProduct("EXT-116", "SKU-116", "123456789016", "Instant Noodles Pack", "Quick Bite", "Instant Foods", "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&q=80", new BigDecimal("70.00"), new BigDecimal("65.00"), new BigDecimal("7.14"), 150, "IN_STOCK", "280g"),
        new ExternalProduct("EXT-117", "SKU-117", "123456789017", "Pasta Penne", "Italiano", "Instant Foods", "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=500&q=80", new BigDecimal("120.00"), new BigDecimal("100.00"), new BigDecimal("16.66"), 80, "IN_STOCK", "500g"),
        new ExternalProduct("EXT-118", "SKU-118", "123456789018", "Tomato Ketchup", "Red Tang", "Instant Foods", "https://images.unsplash.com/photo-1593539828886-f1696b0100d0?w=500&q=80", new BigDecimal("140.00"), new BigDecimal("120.00"), new BigDecimal("14.28"), 90, "IN_STOCK", "1 kg"),
        new ExternalProduct("EXT-134", "SKU-134", "123456789034", "Green Chilli Sauce", "Red Tang", "Instant Foods", "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&q=80", new BigDecimal("65.00"), new BigDecimal("60.00"), new BigDecimal("7.69"), 75, "IN_STOCK", "200g"),

        // Personal Care
        new ExternalProduct("EXT-120", "SKU-120", "123456789020", "Moisturizing Soap", "Soft Touch", "Personal Care", "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=500&q=80", new BigDecimal("150.00"), new BigDecimal("130.00"), new BigDecimal("13.33"), 120, "IN_STOCK", "4 Pack"),
        new ExternalProduct("EXT-121", "SKU-121", "123456789021", "Anti-Dandruff Shampoo", "Hair Care", "Personal Care", "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80", new BigDecimal("350.00"), new BigDecimal("310.00"), new BigDecimal("11.42"), 80, "IN_STOCK", "400 ml"),
        new ExternalProduct("EXT-122", "SKU-122", "123456789022", "Toothpaste", "Mint Fresh", "Personal Care", "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80", new BigDecimal("110.00"), new BigDecimal("95.00"), new BigDecimal("13.63"), 100, "IN_STOCK", "200g"),

        // Household
        new ExternalProduct("EXT-123", "SKU-123", "123456789023", "Liquid Detergent", "Clean Shine", "Household", "https://images.unsplash.com/photo-1584820927498-cafe2c07a769?w=500&q=80", new BigDecimal("450.00"), new BigDecimal("390.00"), new BigDecimal("13.33"), 60, "IN_STOCK", "1 L"),
        new ExternalProduct("EXT-124", "SKU-124", "123456789024", "Dishwash Gel", "Sparkle", "Household", "https://images.unsplash.com/photo-1584820926600-b8ec4b93db5e?w=500&q=80", new BigDecimal("190.00"), new BigDecimal("170.00"), new BigDecimal("10.52"), 90, "IN_STOCK", "750 ml"),
        new ExternalProduct("EXT-135", "SKU-135", "123456789035", "Facial Tissue Pack", "Soft Touch", "Household", "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=500&q=80", new BigDecimal("80.00"), new BigDecimal("75.00"), new BigDecimal("6.25"), 110, "IN_STOCK", "200 pulls")
    );

    @Override
    public Optional<ExternalProduct> fetchProductDetails(String externalId) {
        return MOCK_PRODUCTS.stream()
                .filter(p -> p.externalId().equals(externalId))
                .findFirst();
    }

    @Override
    public List<ExternalProduct> searchProducts(String query) {
        if (query == null || query.isBlank()) return MOCK_PRODUCTS;
        return MOCK_PRODUCTS.stream()
                .filter(p -> p.name().toLowerCase().contains(query.toLowerCase()) || 
                             p.categoryName().toLowerCase().contains(query.toLowerCase()))
                .toList();
    }

    @Override
    public InventoryStatus checkInventory(String externalId) {
        return fetchProductDetails(externalId)
                .map(p -> new InventoryStatus(externalId, p.availableQuantity(), p.availabilityStatus()))
                .orElse(new InventoryStatus(externalId, 0, "OUT_OF_STOCK"));
    }
}
