package com.example.supermarket.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "delivery_cluster_items")
public class DeliveryClusterItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cluster_id", nullable = false)
    private DeliveryCluster cluster;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_id", nullable = false, unique = true)
    private Delivery delivery;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public DeliveryCluster getCluster() { return cluster; }
    public void setCluster(DeliveryCluster cluster) { this.cluster = cluster; }
    public Delivery getDelivery() { return delivery; }
    public void setDelivery(Delivery delivery) { this.delivery = delivery; }
    public Integer getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(Integer sequenceNumber) { this.sequenceNumber = sequenceNumber; }
}
