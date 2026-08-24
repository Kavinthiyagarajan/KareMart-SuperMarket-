package com.example.supermarket.repository;

import com.example.supermarket.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);

    @Modifying
    @Query("UPDATE Coupon c SET c.currentUsage = c.currentUsage + 1 WHERE c.id = :id AND (c.usageLimit IS NULL OR c.currentUsage < c.usageLimit)")
    int incrementUsage(@Param("id") Long id);

    long countByActiveTrue();

    org.springframework.data.domain.Page<Coupon> findByCodeContainingIgnoreCase(String code, org.springframework.data.domain.Pageable pageable);
}
