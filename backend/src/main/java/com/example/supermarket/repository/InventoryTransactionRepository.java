package com.example.supermarket.repository;

import com.example.supermarket.model.InventoryTransaction;
import com.example.supermarket.model.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    @Query("SELECT t FROM InventoryTransaction t WHERE " +
           "(:productId IS NULL OR t.productId = :productId) AND " +
           "(:transactionType IS NULL OR t.transactionType = :transactionType) AND " +
           "(:orderNumber IS NULL OR t.orderNumber = :orderNumber)")
    Page<InventoryTransaction> searchTransactions(
            @Param("productId") Long productId,
            @Param("transactionType") TransactionType transactionType,
            @Param("orderNumber") String orderNumber,
            Pageable pageable);
}
