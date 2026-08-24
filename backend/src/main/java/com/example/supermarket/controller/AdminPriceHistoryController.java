package com.example.supermarket.controller;

import com.example.supermarket.model.PriceHistory;
import com.example.supermarket.repository.PriceHistoryRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminPriceHistoryController {
    private final PriceHistoryRepository priceHistoryRepository;

    public AdminPriceHistoryController(PriceHistoryRepository priceHistoryRepository) {
        this.priceHistoryRepository = priceHistoryRepository;
    }

    @GetMapping("/{productId}/price-history")
    public List<PriceHistory> getPriceHistory(@PathVariable Long productId) {
        return priceHistoryRepository.findByProductIdOrderByEffectiveFromDesc(productId);
    }
}
