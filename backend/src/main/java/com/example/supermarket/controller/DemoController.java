package com.example.supermarket.controller;

import com.example.supermarket.integration.supermarket.ExternalProduct;
import com.example.supermarket.integration.supermarket.MockSupermarketProvider;
import com.example.supermarket.model.Order;
import com.example.supermarket.model.OrderItem;
import com.example.supermarket.model.Product;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.service.DeliveryService;
import com.example.supermarket.service.InventorySyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.Random;

@RestController
@RequestMapping("/api/v1/demo")
public class DemoController {

    private final InventorySyncService inventorySyncService;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final DeliveryService deliveryService;

    public DemoController(InventorySyncService inventorySyncService,
                          OrderRepository orderRepository,
                          ProductRepository productRepository,
                          DeliveryService deliveryService) {
        this.inventorySyncService = inventorySyncService;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.deliveryService = deliveryService;
    }

    @PostMapping("/seed-catalog")
    public ResponseEntity<String> seedCatalog() {
        for (ExternalProduct ep : MockSupermarketProvider.MOCK_PRODUCTS) {
            try {
                inventorySyncService.syncProduct(ep.externalId());
            } catch (Exception e) {
                // Ignore failures to allow partial seeding
            }
        }
        return ResponseEntity.ok("Catalog seeded successfully.");
    }

    @PostMapping("/seed-orders")
    @Transactional
    public ResponseEntity<String> seedOrders() {
        List<Product> products = productRepository.findAll();
        if (products.isEmpty()) {
            return ResponseEntity.badRequest().body("Please seed the catalog first.");
        }
        
        Random random = new Random();
        String[] statuses = {"CONFIRMED", "SHIPPED", "DELIVERED"};

        for (int i = 0; i < 5; i++) {
            Order order = new Order();
            order.setOrderNumber("DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            order.setCustomerId("testuser");
            order.setStatus(statuses[i % statuses.length]);
            order.setSubtotal(BigDecimal.ZERO);
            order.setTax(BigDecimal.ZERO);
            order.setTotal(BigDecimal.ZERO);
            
            // Add 1-3 random items
            int numItems = random.nextInt(3) + 1;
            BigDecimal subtotal = BigDecimal.ZERO;
            
            for (int j = 0; j < numItems; j++) {
                Product p = products.get(random.nextInt(products.size()));
                OrderItem item = new OrderItem();
                item.setProduct(p);
                item.setExternalProductId(p.getExternalId());
                item.setQuantity(random.nextInt(3) + 1);
                item.setUnitPrice(p.getSellingPrice());
                item.setMrp(p.getMrp());
                item.setDiscount(p.getDiscountPercent() != null ? p.getDiscountPercent() : BigDecimal.ZERO);
                
                BigDecimal itemTotal = p.getSellingPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                item.setTotalPrice(itemTotal);
                
                order.addItem(item);
                subtotal = subtotal.add(itemTotal);
            }
            
            order.setSubtotal(subtotal);
            BigDecimal tax = subtotal.multiply(new BigDecimal("0.05"));
            order.setTax(tax);
            order.setTotal(subtotal.add(tax));
            
            Order savedOrder = orderRepository.save(order);
            
            // Create delivery if confirmed or later
            if (!"PENDING_PAYMENT".equals(savedOrder.getStatus())) {
                try {
                    deliveryService.createDeliveryForOrder(savedOrder);
                } catch (Exception e) {
                    // Ignore delivery creation errors
                }
            }
        }
        return ResponseEntity.ok("Orders seeded successfully.");
    }
}
