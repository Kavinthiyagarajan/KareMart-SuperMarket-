package com.example.supermarket.dto;

import com.example.supermarket.model.AddressType;

public record AddressRequest(
    AddressType type,
    String recipientName,
    String phoneNumber,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String pinCode,
    Double latitude,
    Double longitude,
    Boolean isDefault
) {}
