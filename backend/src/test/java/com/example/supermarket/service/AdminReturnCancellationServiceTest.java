package com.example.supermarket.service;

import com.example.supermarket.dto.CancellationRequestDto;
import com.example.supermarket.dto.ReturnRequestDto;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminReturnCancellationServiceTest {

    @Mock
    private CancellationRequestRepository cancellationRequestRepository;

    @Mock
    private ReturnRequestRepository returnRequestRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryReservationService inventoryReservationService;

    @Mock
    private DeliveryService deliveryService;

    @Mock
    private InventoryAuditService inventoryAuditService;

    @Mock
    private NotificationService notificationService;

    private AdminReturnCancellationService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminReturnCancellationService(
                cancellationRequestRepository,
                returnRequestRepository,
                orderRepository,
                productRepository,
                inventoryReservationService,
                deliveryService,
                inventoryAuditService,
                notificationService
        );
    }

    @Test
    void testAdminApproveReturnTransition() {
        ReturnRequest request = new ReturnRequest();
        request.setId(101L);
        request.setOrderNumber("ORD-3001");
        request.setUserId("customer1");
        request.setStatus(RequestStatus.PENDING);
        request.setRefundStatus(RefundStatus.REQUESTED);
        request.setRefundAmount(new BigDecimal("750.00"));

        when(returnRequestRepository.findById(101L)).thenReturn(Optional.of(request));
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> i.getArgument(0));

        ReturnRequestDto result = adminService.reviewReturn(101L, true, "Approved for return", "admin1");

        assertNotNull(result);
        assertEquals(RequestStatus.APPROVED, result.status());
        assertEquals(RefundStatus.APPROVED, result.refundStatus());
        assertEquals("admin1", result.reviewedBy());

        verify(notificationService).createNotification(
                eq("customer1"),
                eq(NotificationType.RETURN_APPROVED),
                anyString(),
                anyString(),
                eq("ORD-3001")
        );
    }

    @Test
    void testAdminRejectReturnTransition() {
        ReturnRequest request = new ReturnRequest();
        request.setId(102L);
        request.setOrderNumber("ORD-3002");
        request.setUserId("customer1");
        request.setStatus(RequestStatus.PENDING);
        request.setRefundStatus(RefundStatus.REQUESTED);
        request.setRefundAmount(new BigDecimal("300.00"));

        when(returnRequestRepository.findById(102L)).thenReturn(Optional.of(request));
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> i.getArgument(0));

        ReturnRequestDto result = adminService.reviewReturn(102L, false, "Item was not damaged", "admin1");

        assertNotNull(result);
        assertEquals(RequestStatus.REJECTED, result.status());
        assertEquals(RefundStatus.REJECTED, result.refundStatus());

        verify(notificationService).createNotification(
                eq("customer1"),
                eq(NotificationType.RETURN_REJECTED),
                anyString(),
                anyString(),
                eq("ORD-3002")
        );
    }

    @Test
    void testInvalidTransitionRejected_CannotReviewNonPendingReturn() {
        ReturnRequest request = new ReturnRequest();
        request.setId(103L);
        request.setStatus(RequestStatus.COMPLETED);

        when(returnRequestRepository.findById(103L)).thenReturn(Optional.of(request));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                adminService.reviewReturn(103L, true, "Notes", "admin1")
        );

        assertTrue(ex.getMessage().contains("Only pending return requests"));
    }

    @Test
    void testCompleteReturnWithRestock() {
        ReturnRequest request = new ReturnRequest();
        request.setId(104L);
        request.setOrderNumber("ORD-3004");
        request.setUserId("customer1");
        request.setStatus(RequestStatus.APPROVED);
        request.setRefundStatus(RefundStatus.APPROVED);
        request.setRefundAmount(new BigDecimal("500.00"));

        Order order = new Order();
        order.setOrderNumber("ORD-3004");
        Product product = new Product();
        product.setId(55L);
        product.setName("Organic Milk");
        product.setAvailableQuantity(10);
        product.setAvailabilityStatus("IN_STOCK");

        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(2);
        order.addItem(item);

        when(returnRequestRepository.findById(104L)).thenReturn(Optional.of(request));
        when(orderRepository.findByOrderNumber("ORD-3004")).thenReturn(Optional.of(order));
        when(productRepository.findByIdForUpdate(55L)).thenReturn(Optional.of(product));
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> i.getArgument(0));

        ReturnRequestDto result = adminService.completeReturn(104L, true, "Items inspected and restocked", "admin1");

        assertNotNull(result);
        assertEquals(RequestStatus.COMPLETED, result.status());
        assertEquals(RefundStatus.COMPLETED, result.refundStatus());
        assertEquals(12, product.getAvailableQuantity());

        verify(inventoryAuditService).recordAudit(
                eq(product),
                eq(2),
                eq(10),
                eq(12),
                eq(TransactionType.ADMIN_ADD),
                anyString(),
                eq("ORD-3004"),
                eq("admin1")
        );
    }
}
