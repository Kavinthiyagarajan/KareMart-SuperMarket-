package com.example.supermarket.service;

import com.example.supermarket.model.InventoryTransaction;
import com.example.supermarket.model.Product;
import com.example.supermarket.model.TransactionType;
import com.example.supermarket.repository.InventoryTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryAuditService {

    private final InventoryTransactionRepository repository;

    public InventoryAuditService(InventoryTransactionRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void recordAudit(Product product, int quantityChange, int previousStock, int resultingStock,
                            TransactionType type, String reason, String orderNumber, String actorUsername) {
        InventoryTransaction tx = new InventoryTransaction();
        tx.setProductId(product.getId());
        tx.setQuantityChange(quantityChange);
        tx.setPreviousStock(previousStock);
        tx.setResultingStock(resultingStock);
        tx.setTransactionType(type);
        tx.setReason(reason);
        tx.setOrderNumber(orderNumber);
        tx.setActorUsername(actorUsername);

        repository.save(tx);
    }
}
