package com.example.supermarket.service;

import com.example.supermarket.dto.CancellationRequestDto;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.CancellationRequestRepository;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CancellationServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private CancellationRequestRepository cancellationRequestRepository;

    @Mock
    private InventoryReservationService inventoryReservationService;

    @Mock
    private DeliveryService deliveryService;

    @Mock
    private NotificationService notificationService;

    private CancellationService cancellationService;

    @BeforeEach
    void setUp() {
        cancellationService = new CancellationService(
                orderRepository,
                paymentRepository,
                cancellationRequestRepository,
                inventoryReservationService,
                deliveryService,
                notificationService
        );
    }

    @Test
    void testCustomerCanCancelEligiblePendingPaymentOrder() {
        Order order = new Order();
        order.setOrderNumber("ORD-1001");
        order.setCustomerId("customer1");
        order.setStatus("PENDING_PAYMENT");
        order.setTotal(new BigDecimal("500.00"));

        when(orderRepository.findByOrderNumber("ORD-1001")).thenReturn(Optional.of(order));
        when(cancellationRequestRepository.save(any(CancellationRequest.class))).thenAnswer(i -> {
            CancellationRequest req = i.getArgument(0);
            req.setId(1L);
            return req;
        });

        CancellationRequestDto result = cancellationService.cancelOrder(
                "ORD-1001",
                CancellationReason.CHANGED_MIND,
                "No longer needed",
                "customer1"
        );

        assertNotNull(result);
        assertEquals("ORD-1001", result.orderNumber());
        assertEquals(RequestStatus.COMPLETED, result.status());
        assertEquals("CANCELLED", order.getStatus());

        verify(inventoryReservationService).releaseReservations("ORD-1001", ReservationStatus.RELEASED);
        verify(notificationService).createNotification(
                eq("customer1"),
                eq(NotificationType.ORDER_CANCELLED),
                anyString(),
                anyString(),
                eq("ORD-1001")
        );
    }

    @Test
    void testCustomerCanCancelConfirmedPaidOrder_InitiatesRefundRequest() {
        Order order = new Order();
        order.setOrderNumber("ORD-1002");
        order.setCustomerId("customer1");
        order.setStatus("CONFIRMED");
        order.setTotal(new BigDecimal("1200.00"));

        Payment payment = new Payment();
        payment.setOrderNumber("ORD-1002");
        payment.setPaymentMethod(PaymentMethod.RAZORPAY);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setAmount(new BigDecimal("1200.00"));

        when(orderRepository.findByOrderNumber("ORD-1002")).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderNumber("ORD-1002")).thenReturn(Optional.of(payment));
        when(cancellationRequestRepository.save(any(CancellationRequest.class))).thenAnswer(i -> {
            CancellationRequest req = i.getArgument(0);
            req.setId(2L);
            return req;
        });

        CancellationRequestDto result = cancellationService.cancelOrder(
                "ORD-1002",
                CancellationReason.ORDERED_BY_MISTAKE,
                "Double order",
                "customer1"
        );

        assertNotNull(result);
        assertEquals(RefundStatus.REQUESTED, result.refundStatus());
        assertEquals(new BigDecimal("1200.00"), result.refundAmount());

        verify(deliveryService).cancelDelivery("ORD-1002");
        verify(inventoryReservationService).releaseReservations("ORD-1002", ReservationStatus.RELEASED);
        verify(notificationService).createNotification(
                eq("customer1"),
                eq(NotificationType.REFUND_REQUESTED),
                anyString(),
                anyString(),
                eq("ORD-1002")
        );
    }

    @Test
    void testCustomerCannotCancelDeliveredOrder() {
        Order order = new Order();
        order.setOrderNumber("ORD-1003");
        order.setCustomerId("customer1");
        order.setStatus("DELIVERED");

        when(orderRepository.findByOrderNumber("ORD-1003")).thenReturn(Optional.of(order));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                cancellationService.cancelOrder("ORD-1003", CancellationReason.OTHER, null, "customer1")
        );

        assertTrue(ex.getMessage().contains("Delivered orders cannot be cancelled"));
        verifyNoInteractions(inventoryReservationService);
    }

    @Test
    void testCustomerCannotCancelAnotherCustomerOrder() {
        Order order = new Order();
        order.setOrderNumber("ORD-1004");
        order.setCustomerId("customer2");
        order.setStatus("CONFIRMED");

        when(orderRepository.findByOrderNumber("ORD-1004")).thenReturn(Optional.of(order));

        assertThrows(SecurityException.class, () ->
                cancellationService.cancelOrder("ORD-1004", CancellationReason.OTHER, null, "customer1")
        );
    }

    @Test
    void testCODOrderCancellationDoesNotRequestOnlineRefund() {
        Order order = new Order();
        order.setOrderNumber("ORD-1005");
        order.setCustomerId("customer1");
        order.setStatus("CONFIRMED");
        order.setTotal(new BigDecimal("350.00"));

        Payment payment = new Payment();
        payment.setOrderNumber("ORD-1005");
        payment.setPaymentMethod(PaymentMethod.COD);
        payment.setStatus(PaymentStatus.SUCCESS);

        when(orderRepository.findByOrderNumber("ORD-1005")).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderNumber("ORD-1005")).thenReturn(Optional.of(payment));
        when(cancellationRequestRepository.save(any(CancellationRequest.class))).thenAnswer(i -> i.getArgument(0));

        CancellationRequestDto result = cancellationService.cancelOrder(
                "ORD-1005",
                CancellationReason.OTHER,
                null,
                "customer1"
        );

        assertEquals(RefundStatus.NOT_REQUESTED, result.refundStatus());
    }
}
