package com.example.supermarket.repository;

import com.example.supermarket.model.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
    List<PriceHistory> findByProductIdOrderByEffectiveFromDesc(Long productId);
    
    PriceHistory findFirstByProductIdOrderByEffectiveFromDesc(Long productId);
}
