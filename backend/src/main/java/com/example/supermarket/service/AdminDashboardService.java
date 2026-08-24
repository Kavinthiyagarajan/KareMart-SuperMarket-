package com.example.supermarket.service;

import com.example.supermarket.dto.AdminDashboardSummaryDto;
import com.example.supermarket.model.DeliveryStatus;
import com.example.supermarket.model.PaymentStatus;
import com.example.supermarket.model.Role;
import com.example.supermarket.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;
    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    @Value("${inventory.low-stock-threshold:10}")
    private int lowStockThreshold;

    public AdminDashboardService(OrderRepository orderRepository,
                                 ProductRepository productRepository,
                                 PaymentRepository paymentRepository,
                                 DeliveryRepository deliveryRepository,
                                 UserRepository userRepository,
                                 CouponRepository couponRepository,
                                 CouponUsageRepository couponUsageRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.paymentRepository = paymentRepository;
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
    }

    public AdminDashboardSummaryDto getDashboardSummary() {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.systemDefault());
        ZonedDateTime startOfDay = LocalDate.now(ZoneId.systemDefault()).atStartOfDay(ZoneId.systemDefault());
        ZonedDateTime startOfMonth = LocalDate.now(ZoneId.systemDefault()).withDayOfMonth(1).atStartOfDay(ZoneId.systemDefault());

        // Orders Metrics
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus("PENDING_PAYMENT");
        long confirmedOrders = orderRepository.countByStatus("CONFIRMED");
        long cancelledOrders = orderRepository.countByStatus("CANCELLED");

        // Sales Metrics
        BigDecimal totalConfirmedSales = orderRepository.sumTotalForConfirmedOrders();
        BigDecimal todayConfirmedSales = orderRepository.sumTotalForConfirmedOrdersSince(startOfDay);
        BigDecimal thisMonthConfirmedSales = orderRepository.sumTotalForConfirmedOrdersSince(startOfMonth);

        // Customers
        long totalRegisteredCustomers = userRepository.countByRole(Role.CUSTOMER);

        // Inventory
        long activeProducts = productRepository.countByActiveTrue();
        long lowStockCount = productRepository.countByActiveTrueAndAvailableQuantityLessThanEqual(lowStockThreshold);
        long outOfStockCount = productRepository.countByActiveTrueAndAvailableQuantityLessThanEqual(0);
        
        List<AdminDashboardSummaryDto.LowStockProductDto> lowStockProducts = productRepository
                .findTop5ByActiveTrueAndAvailableQuantityLessThanEqualOrderByAvailableQuantityAsc(lowStockThreshold)
                .stream()
                .map(p -> new AdminDashboardSummaryDto.LowStockProductDto(
                        p.getExternalId(), p.getName(), p.getAvailableQuantity(), p.getAvailabilityStatus()))
                .collect(Collectors.toList());

        // Payments
        long successfulPayments = paymentRepository.countByStatus(PaymentStatus.SUCCESS);
        long failedPayments = paymentRepository.countByStatus(PaymentStatus.FAILED);
        long pendingPayments = paymentRepository.countByStatus(PaymentStatus.PENDING);

        // Delivery
        long totalDeliveries = deliveryRepository.count();
        long outForDelivery = deliveryRepository.countByStatus(DeliveryStatus.OUT_FOR_DELIVERY);
        long delivered = deliveryRepository.countByStatus(DeliveryStatus.DELIVERED);
        long cancelledDeliveries = deliveryRepository.countByStatus(DeliveryStatus.CANCELLED);

        // Coupons
        long activeCoupons = couponRepository.countByActiveTrue();
        long couponUsageCount = couponUsageRepository.count();

        return new AdminDashboardSummaryDto(
                new AdminDashboardSummaryDto.OrdersMetrics(totalOrders, pendingOrders, confirmedOrders, cancelledOrders),
                new AdminDashboardSummaryDto.SalesMetrics(totalConfirmedSales, todayConfirmedSales, thisMonthConfirmedSales),
                new AdminDashboardSummaryDto.CustomersMetrics(totalRegisteredCustomers),
                new AdminDashboardSummaryDto.InventoryMetrics(activeProducts, lowStockCount, outOfStockCount, lowStockProducts),
                new AdminDashboardSummaryDto.PaymentsMetrics(successfulPayments, failedPayments, pendingPayments),
                new AdminDashboardSummaryDto.DeliveryMetrics(totalDeliveries, outForDelivery, delivered, cancelledDeliveries),
                new AdminDashboardSummaryDto.CouponsMetrics(activeCoupons, couponUsageCount)
        );
    }
}
