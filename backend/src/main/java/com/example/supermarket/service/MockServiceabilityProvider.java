package com.example.supermarket.service;

import com.example.supermarket.model.Address;
import org.springframework.stereotype.Component;

@Component
public class MockServiceabilityProvider implements ServiceabilityProvider {

    @Override
    public boolean isServiceable(Address address) {
        if (address == null || address.getPinCode() == null) {
            return false;
        }
        String pinCode = address.getPinCode().trim();
        // Simple mock rule: Unserviceable if PIN is 000000 or length != 6
        if ("000000".equals(pinCode)) {
            return false;
        }
        return pinCode.length() == 6;
    }

    @Override
    public String getUnserviceableReason(Address address) {
        if (address == null || address.getPinCode() == null) {
            return "Invalid address provided.";
        }
        if ("000000".equals(address.getPinCode().trim())) {
            return "We do not currently deliver to this area.";
        }
        if (address.getPinCode().trim().length() != 6) {
            return "Invalid PIN code format.";
        }
        return null;
    }
}
