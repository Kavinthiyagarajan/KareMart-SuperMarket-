package com.example.supermarket.repository;

import com.example.supermarket.model.DeliveryCluster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryClusterRepository extends JpaRepository<DeliveryCluster, Long> {
    Optional<DeliveryCluster> findByClusterCode(String clusterCode);
}
