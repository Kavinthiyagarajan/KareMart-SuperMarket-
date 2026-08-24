package com.example.supermarket.service;

import com.example.supermarket.model.Address;

public interface ServiceabilityProvider {
    boolean isServiceable(Address address);
    String getUnserviceableReason(Address address);
}
