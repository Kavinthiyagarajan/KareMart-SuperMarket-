package com.example.supermarket.service;

import com.example.supermarket.model.Order;
import com.example.supermarket.model.Payment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class RazorpayPaymentProviderTest {

    private RazorpayPaymentProvider provider;

    @BeforeEach
    public void setup() {
        provider = new RazorpayPaymentProvider();
        ReflectionTestUtils.setField(provider, "keyId", "rzp_test_123");
        ReflectionTestUtils.setField(provider, "keySecret", "secret_123");
    }

    @Test
    public void testGetProviderId() {
        assertEquals("razorpay", provider.getProviderId());
    }

    @Test
    public void testVerifyPayment_ValidSignature() throws Exception {
        // Generating a valid signature for test
        Payment payment = new Payment();
        payment.setProviderPaymentId("order_123");

        String orderId = "order_123";
        String paymentId = "pay_456";
        
        // HmacSHA256 of "order_123|pay_456" with "secret_123"
        String payload = orderId + "|" + paymentId;
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec("secret_123".getBytes(), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(payload.getBytes());
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        String validSignature = hexString.toString();

        Map<String, String> verificationData = Map.of(
                "razorpay_order_id", orderId,
                "razorpay_payment_id", paymentId,
                "razorpay_signature", validSignature
        );

        assertTrue(provider.verifyPayment(payment, verificationData));
    }

    @Test
    public void testVerifyPayment_InvalidSignature() {
        Payment payment = new Payment();
        payment.setProviderPaymentId("order_123");

        Map<String, String> verificationData = Map.of(
                "razorpay_order_id", "order_123",
                "razorpay_payment_id", "pay_456",
                "razorpay_signature", "invalid_signature"
        );

        assertFalse(provider.verifyPayment(payment, verificationData));
    }
}
