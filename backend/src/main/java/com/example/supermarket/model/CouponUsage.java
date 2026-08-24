package com.example.supermarket.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "coupon_usages", uniqueConstraints = {@UniqueConstraint(columnNames = {"coupon_id", "order_number"})})
public class CouponUsage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @Column(name = "order_number", nullable = false)
    private String orderNumber;

    @Column(name = "used_at", insertable = false, updatable = false)
    private ZonedDateTime usedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Coupon getCoupon() { return coupon; }
    public void setCoupon(Coupon coupon) { this.coupon = coupon; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public ZonedDateTime getUsedAt() { return usedAt; }
    public void setUsedAt(ZonedDateTime usedAt) { this.usedAt = usedAt; }
}
