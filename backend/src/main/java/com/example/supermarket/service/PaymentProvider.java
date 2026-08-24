package com.example.supermarket.service;

import com.example.supermarket.model.Order;
import com.example.supermarket.model.Payment;
import java.util.Map;

public interface PaymentProvider {
    String getProviderId();
    Payment createPayment(Order order, Payment payment);
    boolean verifyPayment(Payment payment, Map<String, String> verificationData);
}
