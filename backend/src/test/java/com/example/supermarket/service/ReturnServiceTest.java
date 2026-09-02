package com.example.supermarket.service;

import com.example.supermarket.dto.ReturnRequestDto;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import com.example.supermarket.repository.ReturnRequestRepository;
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
public class ReturnServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ReturnRequestRepository returnRequestRepository;

    @Mock
    private NotificationService notificationService;

    private ReturnService returnService;

    @BeforeEach
    void setUp() {
        returnService = new ReturnService(
                orderRepository,
                paymentRepository,
                returnRequestRepository,
                notificationService
        );
    }

    @Test
    void testCustomerCanRequestReturnForDeliveredPaidOrder() {
        Order order = new Order();
        order.setOrderNumber("ORD-2001");
        order.setCustomerId("customer1");
        order.setStatus("DELIVERED");
        order.setTotal(new BigDecimal("850.00"));

        Payment payment = new Payment();
        payment.setOrderNumber("ORD-2001");
        payment.setStatus(PaymentStatus.SUCCESS);

        when(orderRepository.findByOrderNumber("ORD-2001")).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderNumber("ORD-2001")).thenReturn(Optional.of(payment));
        when(returnRequestRepository.existsByOrderNumberAndStatusIn(eq("ORD-2001"), any())).thenReturn(false);
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> {
            ReturnRequest r = i.getArgument(0);
            r.setId(10L);
            return r;
        });

        ReturnRequestDto result = returnService.requestReturn(
                "ORD-2001",
                ReturnReason.DAMAGED_INCORRECT_ITEM,
                "Item arrived damaged",
                "customer1"
        );

        assertNotNull(result);
        assertEquals(RequestStatus.PENDING, result.status());
        assertEquals(RefundStatus.REQUESTED, result.refundStatus());
        assertEquals(new BigDecimal("850.00"), result.refundAmount());

        verify(notificationService).createNotification(
                eq("customer1"),
                eq(NotificationType.RETURN_REQUESTED),
                anyString(),
                anyString(),
                eq("ORD-2001")
        );
    }

    @Test
    void testReturnRejectedForUndeliveredOrder() {
        Order order = new Order();
        order.setOrderNumber("ORD-2002");
        order.setCustomerId("customer1");
        order.setStatus("CONFIRMED");

        when(orderRepository.findByOrderNumber("ORD-2002")).thenReturn(Optional.of(order));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                returnService.requestReturn("ORD-2002", ReturnReason.PRODUCT_ISSUE, null, "customer1")
        );

        assertTrue(ex.getMessage().contains("Only delivered orders"));
        verifyNoInteractions(returnRequestRepository);
    }

    @Test
    void testDuplicateActiveReturnRequestRejected() {
        Order order = new Order();
        order.setOrderNumber("ORD-2003");
        order.setCustomerId("customer1");
        order.setStatus("DELIVERED");

        Payment payment = new Payment();
        payment.setOrderNumber("ORD-2003");
        payment.setStatus(PaymentStatus.SUCCESS);

        when(orderRepository.findByOrderNumber("ORD-2003")).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderNumber("ORD-2003")).thenReturn(Optional.of(payment));
        when(returnRequestRepository.existsByOrderNumberAndStatusIn(
                eq("ORD-2003"),
                eq(List.of(RequestStatus.PENDING, RequestStatus.APPROVED))
        )).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                returnService.requestReturn("ORD-2003", ReturnReason.PRODUCT_ISSUE, null, "customer1")
        );

        assertTrue(ex.getMessage().contains("An active return request already exists"));
    }

    @Test
    void testCustomerCannotRequestReturnForAnotherCustomerOrder() {
        Order order = new Order();
        order.setOrderNumber("ORD-2004");
        order.setCustomerId("customer2");

        when(orderRepository.findByOrderNumber("ORD-2004")).thenReturn(Optional.of(order));

        assertThrows(SecurityException.class, () ->
                returnService.requestReturn("ORD-2004", ReturnReason.OTHER, null, "customer1")
        );
    }
}
