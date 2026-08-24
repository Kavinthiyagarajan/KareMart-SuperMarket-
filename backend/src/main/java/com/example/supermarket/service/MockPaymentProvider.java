package com.example.supermarket.service;

import com.example.supermarket.model.Order;
import com.example.supermarket.model.Payment;
import com.example.supermarket.model.PaymentStatus;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.math.BigDecimal;

@Service
public class MockPaymentProvider implements PaymentProvider {

    @Override
    public String getProviderId() {
        return "MOCK";
    }

    @Override
    public Payment createPayment(Order order, Payment payment) {
        payment.setProviderPaymentId("mock_txn_" + UUID.randomUUID().toString());
        payment.setStatus(PaymentStatus.PENDING);
        return payment;
    }

    @Override
    public boolean verifyPayment(Payment payment, Map<String, String> verificationData) {
        // Deterministic failure: if total is exactly 999.99 or mockCardNumber starts with 4111
        if (payment.getAmount().compareTo(new BigDecimal("999.99")) == 0) {
            return false;
        }

        String mockCardNumber = verificationData != null ? verificationData.get("mockCardNumber") : null;
        if (mockCardNumber != null && mockCardNumber.startsWith("4111")) {
            return false;
        }

        return true;
    }
}
