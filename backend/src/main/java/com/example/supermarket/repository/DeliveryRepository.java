package com.example.supermarket.repository;

import com.example.supermarket.model.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByOrderNumber(String orderNumber);
    long countByStatus(com.example.supermarket.model.DeliveryStatus status);
}
