package com.example.supermarket.controller;

import com.example.supermarket.model.DeliveryCluster;
import com.example.supermarket.service.DeliveryClusterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/delivery-clusters")
public class AdminDeliveryClusterController {

    private final DeliveryClusterService deliveryClusterService;

    @Autowired
    public AdminDeliveryClusterController(DeliveryClusterService deliveryClusterService) {
        this.deliveryClusterService = deliveryClusterService;
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DeliveryCluster>> generateClusters() {
        List<DeliveryCluster> clusters = deliveryClusterService.generateClusters();
        return ResponseEntity.ok(clusters);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DeliveryCluster>> listClusters() {
        List<DeliveryCluster> clusters = deliveryClusterService.getAllClusters();
        return ResponseEntity.ok(clusters);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DeliveryCluster> getCluster(@PathVariable Long id) {
        return deliveryClusterService.getClusterById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DeliveryCluster> updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        return deliveryClusterService.updateClusterStatus(id, request.getStatus())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/deliveries/{deliveryId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> addDelivery(@PathVariable Long id, @PathVariable Long deliveryId) {
        boolean added = deliveryClusterService.addDeliveryToCluster(id, deliveryId);
        if (added) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/{id}/deliveries/{deliveryId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeDelivery(@PathVariable Long id, @PathVariable Long deliveryId) {
        boolean removed = deliveryClusterService.removeDeliveryFromCluster(id, deliveryId);
        if (removed) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }

    // Simple DTO for status update
    public static class StatusUpdateRequest {
        private String status;
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
