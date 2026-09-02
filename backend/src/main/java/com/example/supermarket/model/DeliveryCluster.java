package com.example.supermarket.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.List;

@Entity
@Table(name = "delivery_clusters")
public class DeliveryCluster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cluster_code", nullable = false, unique = true)
    private String clusterCode;

    @Column(nullable = false)
    private String status; // DRAFT, READY, ASSIGNED, IN_TRANSIT, COMPLETED, CANCELLED

    @Column(name = "estimated_distance")
    private Double estimatedDistance;

    @Column(name = "estimated_duration")
    private java.time.Duration estimatedDuration;

    @Column(name = "estimated_cost")
    private Double estimatedCost;

    @Column(name = "estimated_revenue")
    private Double estimatedRevenue;

    @Column(name = "estimated_profit")
    private Double estimatedProfit;

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "scheduled_at")
    private ZonedDateTime scheduledAt;

    @Column(name = "started_at")
    private ZonedDateTime startedAt;

    @Column(name = "completed_at")
    private ZonedDateTime completedAt;

    @com.fasterxml.jackson.annotation.JsonManagedReference
    @OneToMany(mappedBy = "cluster", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequenceNumber ASC")
    private List<DeliveryClusterItem> items;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getClusterCode() { return clusterCode; }
    public void setClusterCode(String clusterCode) { this.clusterCode = clusterCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getEstimatedDistance() { return estimatedDistance; }
    public void setEstimatedDistance(Double estimatedDistance) { this.estimatedDistance = estimatedDistance; }
    public java.time.Duration getEstimatedDuration() { return estimatedDuration; }
    public void setEstimatedDuration(java.time.Duration estimatedDuration) { this.estimatedDuration = estimatedDuration; }
    public Double getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(Double estimatedCost) { this.estimatedCost = estimatedCost; }
    public Double getEstimatedRevenue() { return estimatedRevenue; }
    public void setEstimatedRevenue(Double estimatedRevenue) { this.estimatedRevenue = estimatedRevenue; }
    public Double getEstimatedProfit() { return estimatedProfit; }
    public void setEstimatedProfit(Double estimatedProfit) { this.estimatedProfit = estimatedProfit; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    public ZonedDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(ZonedDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public ZonedDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(ZonedDateTime startedAt) { this.startedAt = startedAt; }
    public ZonedDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(ZonedDateTime completedAt) { this.completedAt = completedAt; }
    public List<DeliveryClusterItem> getItems() { return items; }
    public void setItems(List<DeliveryClusterItem> items) { this.items = items; }
}
