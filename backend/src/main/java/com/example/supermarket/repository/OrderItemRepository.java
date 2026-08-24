package com.example.supermarket.repository;

import com.example.supermarket.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT COUNT(oi) FROM OrderItem oi JOIN oi.order o WHERE o.customerId = :customerId AND oi.product.id = :productId AND o.status IN (:statuses)")
    long countPurchases(@Param("customerId") String customerId, @Param("productId") Long productId, @Param("statuses") List<String> statuses);

    @Query("SELECT oi.product.id FROM OrderItem oi JOIN oi.order o WHERE o.customerId = :customerId AND o.status IN (:statuses) GROUP BY oi.product.id ORDER BY MAX(o.createdAt) DESC")
    List<Long> findProductIdsByCustomerIdAndStatuses(@Param("customerId") String customerId, @Param("statuses") List<String> statuses);

    @Query("SELECT oi.product.id FROM OrderItem oi JOIN oi.order o WHERE o.status IN (:statuses) GROUP BY oi.product.id ORDER BY SUM(oi.quantity) DESC")
    List<Long> findPopularProductIds(@Param("statuses") List<String> statuses, org.springframework.data.domain.Pageable pageable);
}
