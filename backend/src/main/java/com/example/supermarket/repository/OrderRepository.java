package com.example.supermarket.repository;

import com.example.supermarket.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    org.springframework.data.domain.Page<Order> findByCustomerIdOrderByIdDesc(String customerId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE o.status = :status AND o.createdAt < :cutoff")
    java.util.List<Order> findByStatusAndCreatedAtBefore(
        @org.springframework.data.repository.query.Param("status") String status, 
        @org.springframework.data.repository.query.Param("cutoff") java.time.ZonedDateTime cutoff
    );

    org.springframework.data.domain.Page<Order> findAllByOrderByIdDesc(org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Order> findByStatusOrderByIdDesc(String status, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(o.customerId) LIKE LOWER(CONCAT('%', :search, '%')) ORDER BY o.id DESC")
    org.springframework.data.domain.Page<Order> findBySearch(
        @org.springframework.data.repository.query.Param("search") String search,
        org.springframework.data.domain.Pageable pageable
    );

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE o.status = :status AND (LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(o.customerId) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY o.id DESC")
    org.springframework.data.domain.Page<Order> findByStatusAndSearch(
        @org.springframework.data.repository.query.Param("status") String status,
        @org.springframework.data.repository.query.Param("search") String search,
        org.springframework.data.domain.Pageable pageable
    );

    default org.springframework.data.domain.Page<Order> searchOrders(String status, String search, org.springframework.data.domain.Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        if (cleanStatus != null && cleanSearch != null) {
            return findByStatusAndSearch(cleanStatus, cleanSearch, pageable);
        } else if (cleanStatus != null) {
            return findByStatusOrderByIdDesc(cleanStatus, pageable);
        } else if (cleanSearch != null) {
            return findBySearch(cleanSearch, pageable);
        } else {
            return findAllByOrderByIdDesc(pageable);
        }
    }

    long countByStatus(String status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status IN ('CONFIRMED', 'DELIVERED')")
    java.math.BigDecimal sumTotalForConfirmedOrders();

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status IN ('CONFIRMED', 'DELIVERED') AND o.createdAt >= :startDate")
    java.math.BigDecimal sumTotalForConfirmedOrdersSince(@org.springframework.data.repository.query.Param("startDate") java.time.ZonedDateTime startDate);
}
