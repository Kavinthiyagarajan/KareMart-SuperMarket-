package com.example.supermarket.service;

import com.example.supermarket.model.Delivery;
import com.example.supermarket.model.DeliveryStatus;
import com.example.supermarket.model.Order;
import com.example.supermarket.repository.DeliveryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private DeliveryProvider deliveryProvider;

    @Mock
    private NotificationService notificationService;

    @Mock
    private com.example.supermarket.repository.OrderRepository orderRepository;

    private DeliveryService deliveryService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(deliveryProvider.getProviderId()).thenReturn("mock");
        deliveryService = new DeliveryService(deliveryRepository, List.of(deliveryProvider), notificationService, orderRepository, "mock");
    }

    @Test
    void createDeliveryForOrder_success() {
        Order order = new Order();
        order.setOrderNumber("ORD-123");
        order.setStatus("CONFIRMED");

        Delivery mockDelivery = new Delivery();
        mockDelivery.setStatus(DeliveryStatus.CREATED);

        when(deliveryRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.empty());
        when(deliveryProvider.createDelivery(eq(order), any(Delivery.class))).thenReturn(mockDelivery);
        when(deliveryRepository.save(any(Delivery.class))).thenReturn(mockDelivery);

        Delivery result = deliveryService.createDeliveryForOrder(order);

        assertNotNull(result);
        assertEquals(DeliveryStatus.CREATED, result.getStatus());
        verify(deliveryRepository).save(any(Delivery.class));
    }

    @Test
    void createDeliveryForOrder_failsIfNotConfirmed() {
        Order order = new Order();
        order.setOrderNumber("ORD-123");
        order.setStatus("PENDING_PAYMENT");

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            deliveryService.createDeliveryForOrder(order);
        });

        assertEquals("Cannot create delivery for order not in CONFIRMED state.", exception.getMessage());
        verify(deliveryRepository, never()).save(any());
    }
}
