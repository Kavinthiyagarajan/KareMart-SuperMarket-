package com.example.supermarket.controller;

import com.example.supermarket.model.InventoryTransaction;
import com.example.supermarket.model.TransactionType;
import com.example.supermarket.repository.InventoryTransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/inventory/history")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInventoryAuditController {

    private final InventoryTransactionRepository repository;

    public AdminInventoryAuditController(InventoryTransactionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<Page<InventoryTransaction>> getHistory(
            @RequestParam(value = "productId", required = false) Long productId,
            @RequestParam(value = "transactionType", required = false) TransactionType transactionType,
            @RequestParam(value = "orderNumber", required = false) String orderNumber,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InventoryTransaction> transactions = repository.searchTransactions(productId, transactionType, orderNumber, pageable);
        return ResponseEntity.ok(transactions);
    }
}
