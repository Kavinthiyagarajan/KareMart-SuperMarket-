package com.example.supermarket.repository;

import com.example.supermarket.model.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    long countByCouponIdAndCustomerId(Long couponId, String customerId);
}
