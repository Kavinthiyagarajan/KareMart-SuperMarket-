package com.example.supermarket.repository;

import com.example.supermarket.model.DeliveryClusterItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DeliveryClusterItemRepository extends JpaRepository<DeliveryClusterItem, Long> {
    boolean existsByDeliveryId(Long deliveryId);
    long countByClusterId(Long clusterId);
    Optional<DeliveryClusterItem> findByClusterIdAndDeliveryId(Long clusterId, Long deliveryId);
}
