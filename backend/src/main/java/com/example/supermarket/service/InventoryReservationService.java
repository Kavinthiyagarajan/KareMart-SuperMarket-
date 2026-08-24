package com.example.supermarket.service;

import com.example.supermarket.model.InventoryReservation;
import com.example.supermarket.model.ReservationStatus;
import com.example.supermarket.model.Order;
import com.example.supermarket.model.OrderItem;
import com.example.supermarket.repository.InventoryReservationRepository;
import com.example.supermarket.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Service
public class InventoryReservationService {

    private final InventoryReservationRepository reservationRepository;
    private final ProductRepository productRepository;
    private final InventoryAuditService inventoryAuditService;

    public InventoryReservationService(InventoryReservationRepository reservationRepository, ProductRepository productRepository, InventoryAuditService inventoryAuditService) {
        this.reservationRepository = reservationRepository;
        this.productRepository = productRepository;
        this.inventoryAuditService = inventoryAuditService;
    }

    @Transactional
    public void reserveStock(Order order, ZonedDateTime expiresAt) {
        for (OrderItem item : order.getItems()) {
            InventoryReservation res = new InventoryReservation();
            res.setOrderNumber(order.getOrderNumber());
            res.setProductId(item.getProduct().getId());
            res.setQuantity(item.getQuantity());
            res.setStatus(ReservationStatus.ACTIVE);
            res.setExpiresAt(expiresAt);
            reservationRepository.save(res);
        }
    }

    @Transactional
    public void commitReservations(String orderNumber) {
        List<InventoryReservation> activeReservations = reservationRepository.findByOrderNumberAndStatus(orderNumber, ReservationStatus.ACTIVE);
        for (InventoryReservation res : activeReservations) {
            res.setStatus(ReservationStatus.COMMITTED);
            
            com.example.supermarket.model.Product product = productRepository.findById(res.getProductId()).orElse(null);
            if (product != null) {
                inventoryAuditService.recordAudit(product, 0, product.getAvailableQuantity(), product.getAvailableQuantity(),
                        com.example.supermarket.model.TransactionType.RESERVATION_COMMIT, "Reservation committed", orderNumber, "SYSTEM");
            }
        }
        reservationRepository.saveAll(activeReservations);
    }

    @Transactional
    public void releaseReservations(String orderNumber, ReservationStatus targetStatus) {
        List<InventoryReservation> activeReservations = reservationRepository.findByOrderNumberAndStatus(orderNumber, ReservationStatus.ACTIVE);
        
        // Sort by productId to prevent deadlocks when locking multiple products
        activeReservations.sort(java.util.Comparator.comparing(InventoryReservation::getProductId));
        
        for (InventoryReservation res : activeReservations) {
            // Restore stock atomically and safely via pessimistic locking
            com.example.supermarket.model.Product product = productRepository.findByIdForUpdate(res.getProductId()).orElse(null);
            if (product != null) {
                int prevStock = product.getAvailableQuantity();
                product.setAvailableQuantity(prevStock + res.getQuantity());
                product.setAvailabilityStatus(product.getAvailableQuantity() > 0 ? "IN_STOCK" : "OUT_OF_STOCK");
                productRepository.save(product);
                
                inventoryAuditService.recordAudit(product, res.getQuantity(), prevStock, product.getAvailableQuantity(),
                        com.example.supermarket.model.TransactionType.RESERVATION_RELEASE, "Reservation released: " + targetStatus, orderNumber, "SYSTEM");
            }
            res.setStatus(targetStatus);
        }
        reservationRepository.saveAll(activeReservations);
    }
}
