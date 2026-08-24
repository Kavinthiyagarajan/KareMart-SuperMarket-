package com.example.supermarket.dto;

import com.example.supermarket.model.Address;
import com.example.supermarket.model.AddressType;

public record AddressDto(
    Long id,
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
    Boolean isDefault,
    Boolean isServiceable,
    String unserviceableReason
) {
    public static AddressDto from(Address address, boolean isServiceable, String unserviceableReason) {
        return new AddressDto(
            address.getId(),
            address.getType(),
            address.getRecipientName(),
            address.getPhoneNumber(),
            address.getAddressLine1(),
            address.getAddressLine2(),
            address.getCity(),
            address.getState(),
            address.getPinCode(),
            address.getLatitude(),
            address.getLongitude(),
            address.getIsDefault(),
            isServiceable,
            unserviceableReason
        );
    }
}
