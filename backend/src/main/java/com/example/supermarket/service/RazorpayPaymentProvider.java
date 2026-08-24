package com.example.supermarket.service;

import com.example.supermarket.model.Order;
import com.example.supermarket.model.Payment;
import com.example.supermarket.model.PaymentStatus;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class RazorpayPaymentProvider implements PaymentProvider {

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    @Override
    public String getProviderId() {
        return "razorpay";
    }

    @Override
    public Payment createPayment(Order order, Payment payment) {
        if (keyId == null || keyId.isEmpty() || keySecret == null || keySecret.isEmpty()) {
            throw new RuntimeException("Razorpay credentials are not configured.");
        }

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject orderRequest = new JSONObject();
            // Amount is in smallest currency unit (paise for INR)
            orderRequest.put("amount", payment.getAmount().multiply(new BigDecimal("100")).intValue());
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", order.getOrderNumber());

            com.razorpay.Order razorpayOrder = client.orders.create(orderRequest);
            payment.setProviderPaymentId(razorpayOrder.get("id")); // "order_xxxx"
            payment.setStatus(PaymentStatus.CREATED);
            return payment;
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to create Razorpay order", e);
        }
    }

    @Override
    public boolean verifyPayment(Payment payment, Map<String, String> verificationData) {
        if (verificationData == null) return false;

        String razorpayPaymentId = verificationData.get("razorpay_payment_id");
        String razorpayOrderId = verificationData.get("razorpay_order_id");
        String razorpaySignature = verificationData.get("razorpay_signature");

        if (razorpayPaymentId == null || razorpayOrderId == null || razorpaySignature == null) {
            return false;
        }

        if (!razorpayOrderId.equals(payment.getProviderPaymentId())) {
            return false;
        }

        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            String generatedSignature = calculateHmacSha256(payload, keySecret);
            return generatedSignature.equals(razorpaySignature);
        } catch (Exception e) {
            return false;
        }
    }

    private String calculateHmacSha256(String data, String secret) throws Exception {
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(secret.getBytes(), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(data.getBytes());
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
