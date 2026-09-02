package com.example.supermarket.repository;

import com.example.supermarket.model.InventoryReservation;
import com.example.supermarket.model.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;

@Repository
public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, Long> {
    List<InventoryReservation> findByOrderNumber(String orderNumber);
    List<InventoryReservation> findByOrderNumberAndStatus(String orderNumber, ReservationStatus status);
    List<InventoryReservation> findByOrderNumberAndStatusIn(String orderNumber, List<ReservationStatus> statuses);
}
