package com.example.supermarket.service;

import com.example.supermarket.model.PriceHistory;
import com.example.supermarket.model.Product;
import com.example.supermarket.repository.PriceHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.ZonedDateTime;
import java.util.List;

@Service
public class PriceHistoryService {
    private final PriceHistoryRepository priceHistoryRepository;

    public PriceHistoryService(PriceHistoryRepository priceHistoryRepository) {
        this.priceHistoryRepository = priceHistoryRepository;
    }

    public List<PriceHistory> getHistoryForProduct(Long productId) {
        return priceHistoryRepository.findByProductIdOrderByEffectiveFromDesc(productId);
    }

    @Transactional
    public void recordPriceChange(Product product, String source) {
        PriceHistory lastRecord = priceHistoryRepository.findFirstByProductIdOrderByEffectiveFromDesc(product.getId());
        
        ZonedDateTime now = ZonedDateTime.now();
        
        if (lastRecord != null) {
            // Check if price/mrp actually changed
            if (lastRecord.getPrice().compareTo(product.getSellingPrice()) == 0 &&
                lastRecord.getMrp().compareTo(product.getMrp()) == 0) {
                return; // No change, don't record duplicate
            }
            
            // Close previous record
            lastRecord.setEffectiveTo(now);
            priceHistoryRepository.save(lastRecord);
        }

        // Create new record
        PriceHistory newRecord = new PriceHistory();
        newRecord.setProduct(product);
        newRecord.setExternalProductId(product.getExternalId());
        newRecord.setPrice(product.getSellingPrice());
        newRecord.setMrp(product.getMrp());
        newRecord.setDiscount(product.getDiscountPercent());
        newRecord.setSource(source);
        newRecord.setEffectiveFrom(now);
        
        priceHistoryRepository.save(newRecord);
    }
}
