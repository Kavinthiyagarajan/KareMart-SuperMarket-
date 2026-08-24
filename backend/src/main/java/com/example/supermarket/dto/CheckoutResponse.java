package com.example.supermarket.dto;

import java.math.BigDecimal;
import java.util.List;

public record CheckoutResponse(
    boolean success,
    String checkoutToken,
    BigDecimal subtotal,
    BigDecimal discount,
    BigDecimal tax,
    BigDecimal total,
    String couponCode,
    List<CheckoutError> errors
) {}
