package com.example.supermarket.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "price_history")
public class PriceHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "external_product_id", nullable = false)
    private String externalProductId;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private BigDecimal mrp;

    private BigDecimal discount;

    @Column(nullable = false)
    private String source;

    @Column(name = "effective_from", nullable = false)
    private ZonedDateTime effectiveFrom;

    @Column(name = "effective_to")
    private ZonedDateTime effectiveTo;

    @Column(name = "synced_at", insertable = false, updatable = false)
    private ZonedDateTime syncedAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private ZonedDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public String getExternalProductId() { return externalProductId; }
    public void setExternalProductId(String externalProductId) { this.externalProductId = externalProductId; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getMrp() { return mrp; }
    public void setMrp(BigDecimal mrp) { this.mrp = mrp; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public ZonedDateTime getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(ZonedDateTime effectiveFrom) { this.effectiveFrom = effectiveFrom; }
    public ZonedDateTime getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(ZonedDateTime effectiveTo) { this.effectiveTo = effectiveTo; }
    public ZonedDateTime getSyncedAt() { return syncedAt; }
    public void setSyncedAt(ZonedDateTime syncedAt) { this.syncedAt = syncedAt; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
