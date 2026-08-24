package com.example.supermarket.service;

import com.example.supermarket.model.Delivery;
import com.example.supermarket.model.DeliveryStatus;
import com.example.supermarket.model.Order;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.UUID;

@Service
public class MockDeliveryProvider implements DeliveryProvider {

    @Override
    public String getProviderId() {
        return "mock";
    }

    @Override
    public Delivery createDelivery(Order order, Delivery delivery) {
        String mockId = "mock_del_" + UUID.randomUUID().toString();
        delivery.setProviderDeliveryId(mockId);
        delivery.setStatus(DeliveryStatus.CREATED);
        delivery.setTrackingUrl("http://mock-tracker.local/track/" + mockId);
        delivery.setEstimatedDeliveryTime(ZonedDateTime.now().plusDays(2));
        return delivery;
    }

    @Override
    public Delivery updateDeliveryStatus(Delivery delivery) {
        if (delivery.getStatus() == DeliveryStatus.DELIVERED || delivery.getStatus() == DeliveryStatus.CANCELLED) {
            return delivery;
        }

        // Deterministic mock advancement based on time or just simple progression for demo purposes
        // Since we want simple testable transitions, we will just cycle through
        switch (delivery.getStatus()) {
            case CREATED:
                delivery.setStatus(DeliveryStatus.ASSIGNED);
                break;
            case ASSIGNED:
                delivery.setStatus(DeliveryStatus.PICKED_UP);
                break;
            case PICKED_UP:
                delivery.setStatus(DeliveryStatus.OUT_FOR_DELIVERY);
                break;
            case OUT_FOR_DELIVERY:
                delivery.setStatus(DeliveryStatus.DELIVERED);
                break;
            default:
                break;
        }

        return delivery;
    }

    @Override
    public void cancelDelivery(Delivery delivery) {
        if (delivery.getStatus() == DeliveryStatus.DELIVERED) {
            throw new RuntimeException("Cannot cancel a delivered order.");
        }
        delivery.setStatus(DeliveryStatus.CANCELLED);
    }
}
