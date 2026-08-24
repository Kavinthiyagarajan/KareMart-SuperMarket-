package com.example.supermarket.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardSummaryDto(
    OrdersMetrics orders,
    SalesMetrics sales,
    CustomersMetrics customers,
    InventoryMetrics inventory,
    PaymentsMetrics payments,
    DeliveryMetrics delivery,
    CouponsMetrics coupons
) {
    public record OrdersMetrics(long total, long pendingPayment, long confirmed, long cancelled) {}
    public record SalesMetrics(BigDecimal totalConfirmed, BigDecimal todayConfirmed, BigDecimal thisMonthConfirmed) {}
    public record CustomersMetrics(long totalRegistered) {}
    public record InventoryMetrics(long activeProducts, long lowStockCount, long outOfStockCount, List<LowStockProductDto> lowStockProducts) {}
    public record LowStockProductDto(String productNumber, String name, int availableQuantity, String availabilityStatus) {}
    public record PaymentsMetrics(long successful, long failed, long pending) {}
    public record DeliveryMetrics(long created, long outForDelivery, long delivered, long cancelled) {}
    public record CouponsMetrics(long active, long usageCount) {}
}
