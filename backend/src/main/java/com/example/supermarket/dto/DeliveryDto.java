package com.example.supermarket.dto;

import com.example.supermarket.model.DeliveryStatus;
import java.time.ZonedDateTime;

public record DeliveryDto(
    String orderNumber,
    String provider,
    DeliveryStatus status,
    String trackingUrl,
    ZonedDateTime estimatedDeliveryTime,
    ZonedDateTime updatedAt
) {}
