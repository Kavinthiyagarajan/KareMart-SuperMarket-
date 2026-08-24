package com.example.supermarket.controller;

import com.example.supermarket.model.Product;
import com.example.supermarket.service.InventorySyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/sync")
public class AdminSyncController {
    private final InventorySyncService inventorySyncService;

    public AdminSyncController(InventorySyncService inventorySyncService) {
        this.inventorySyncService = inventorySyncService;
    }

    @PostMapping("/product/{externalId}")
    public ResponseEntity<Product> syncProduct(@PathVariable String externalId) {
        try {
            Product product = inventorySyncService.syncProduct(externalId);
            return ResponseEntity.ok(product);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
