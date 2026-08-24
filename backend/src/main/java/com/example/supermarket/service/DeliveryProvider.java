package com.example.supermarket.service;

import com.example.supermarket.model.Delivery;
import com.example.supermarket.model.Order;

public interface DeliveryProvider {
    String getProviderId();
    Delivery createDelivery(Order order, Delivery delivery);
    Delivery updateDeliveryStatus(Delivery delivery);
    void cancelDelivery(Delivery delivery);
}
