package com.example.supermarket.service;

import com.example.supermarket.model.Address;
import org.springframework.stereotype.Service;

@Service
public class ServiceabilityService {

    private final ServiceabilityProvider provider;

    public ServiceabilityService(ServiceabilityProvider provider) {
        this.provider = provider;
    }

    public boolean isServiceable(Address address) {
        return provider.isServiceable(address);
    }

    public String getUnserviceableReason(Address address) {
        return provider.getUnserviceableReason(address);
    }
}
