package com.example.supermarket.service;

import com.example.supermarket.dto.PaymentCreationRequest;
import com.example.supermarket.model.Order;
import com.example.supermarket.model.Payment;
import com.example.supermarket.model.PaymentMethod;
import com.example.supermarket.model.PaymentStatus;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentProvider paymentProvider;

    @Mock
    private InventoryReservationService inventoryReservationService;

    @Mock
    private NotificationService notificationService;

    private PaymentService paymentService;

    private Order testOrder;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        DeliveryService deliveryService = mock(DeliveryService.class);
        
        when(paymentProvider.getProviderId()).thenReturn("mock");
        paymentService = new PaymentService(paymentRepository, orderRepository, 
                                            java.util.List.of(paymentProvider), 
                                            inventoryReservationService, 
                                            deliveryService,
                                            notificationService,
                                            "mock");

        testOrder = new Order();
        testOrder.setOrderNumber("ORD-123");
        testOrder.setCustomerId("testuser");
        testOrder.setStatus("PENDING_PAYMENT");
        testOrder.setTotal(new BigDecimal("100.00"));
    }

    @Test
    void createPayment_withCOD_success() {
        PaymentCreationRequest req = new PaymentCreationRequest("ORD-123", PaymentMethod.COD, "idemp-key-1");
        
        when(paymentRepository.findByIdempotencyKey("idemp-key-1")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.of(testOrder));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(1L);
            return p;
        });

        Payment result = paymentService.createPayment(req, "testuser");

        assertNotNull(result);
        assertEquals(PaymentMethod.COD, result.getProvider());
        assertEquals(PaymentStatus.SUCCESS, result.getStatus());
        assertEquals("CONFIRMED", testOrder.getStatus());
        verify(orderRepository).save(testOrder);
    }

    @Test
    void createPayment_withMock_success() {
        PaymentCreationRequest req = new PaymentCreationRequest("ORD-123", PaymentMethod.MOCK, "idemp-key-2");
        
        when(paymentRepository.findByIdempotencyKey("idemp-key-2")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.of(testOrder));
        when(paymentProvider.createPayment(any(Order.class), any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(1);
            p.setProviderPaymentId("mock-pi-123");
            return p;
        });
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(2L);
            return p;
        });

        Payment result = paymentService.createPayment(req, "testuser");

        assertNotNull(result);
        assertEquals(PaymentMethod.MOCK, result.getProvider());
        assertEquals(PaymentStatus.CREATED, result.getStatus());
        assertEquals("PENDING_PAYMENT", testOrder.getStatus()); // Should not confirm yet
        verify(orderRepository, never()).save(testOrder);
    }

    @Test
    void createPayment_duplicateIdempotencyKey_returnsExisting() {
        PaymentCreationRequest req = new PaymentCreationRequest("ORD-123", PaymentMethod.MOCK, "idemp-key-3");
        
        Payment existing = new Payment();
        existing.setId(3L);
        existing.setCustomerId("testuser");
        
        when(paymentRepository.findByIdempotencyKey("idemp-key-3")).thenReturn(Optional.of(existing));

        Payment result = paymentService.createPayment(req, "testuser");

        assertNotNull(result);
        assertEquals(3L, result.getId());
        verify(orderRepository, never()).findByOrderNumber(anyString());
    }

    @Test
    void verifyPayment_success() {
        Payment payment = new Payment();
        payment.setId(4L);
        payment.setOrderNumber("ORD-123");
        payment.setCustomerId("testuser");
        payment.setStatus(PaymentStatus.CREATED);
        
        when(paymentRepository.findById(4L)).thenReturn(Optional.of(payment));
        when(paymentProvider.verifyPayment(eq(payment), any())).thenReturn(true);
        when(orderRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.of(testOrder));
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

        Payment result = paymentService.verifyPayment(4L, Map.of("mockCardNumber", "4242"), "testuser");

        assertEquals(PaymentStatus.SUCCESS, result.getStatus());
        assertEquals("CONFIRMED", testOrder.getStatus());
        verify(orderRepository).save(testOrder);
    }

    @Test
    void verifyPayment_failure() {
        Payment payment = new Payment();
        payment.setId(5L);
        payment.setOrderNumber("ORD-123");
        payment.setCustomerId("testuser");
        payment.setStatus(PaymentStatus.CREATED);
        
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));
        when(paymentProvider.verifyPayment(eq(payment), any())).thenReturn(false);
        when(orderRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.of(testOrder));
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

        Payment result = paymentService.verifyPayment(5L, Map.of("mockCardNumber", "4111"), "testuser");

        assertEquals(PaymentStatus.FAILED, result.getStatus());
        assertEquals("CANCELLED", testOrder.getStatus());
        verify(orderRepository).save(testOrder);
        verify(inventoryReservationService).releaseReservations("ORD-123", com.example.supermarket.model.ReservationStatus.RELEASED);
    }
}
