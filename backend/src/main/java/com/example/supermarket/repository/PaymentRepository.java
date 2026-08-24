package com.example.supermarket.repository;

import com.example.supermarket.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    Optional<Payment> findByOrderNumber(String orderNumber);
    long countByStatus(com.example.supermarket.model.PaymentStatus status);
}
