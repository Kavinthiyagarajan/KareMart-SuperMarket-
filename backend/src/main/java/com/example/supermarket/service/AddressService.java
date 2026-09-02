package com.example.supermarket.service;

import com.example.supermarket.dto.AddressDto;
import com.example.supermarket.dto.AddressRequest;
import com.example.supermarket.model.Address;
import com.example.supermarket.model.User;
import com.example.supermarket.repository.AddressRepository;
import com.example.supermarket.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final ServiceabilityService serviceabilityService;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository, ServiceabilityService serviceabilityService) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.serviceabilityService = serviceabilityService;
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public List<AddressDto> getMyAddresses(String username) {
        User user = getUserByUsername(username);
        List<Address> addresses = addressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(user);
        return addresses.stream().map(this::toDto).collect(Collectors.toList());
    }

    public AddressDto getAddress(Long id, String username) {
        User user = getUserByUsername(username);
        Address address = addressRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        return toDto(address);
    }

    @Transactional
    public AddressDto createAddress(AddressRequest request, String username) {
        User user = getUserByUsername(username);
        
        Address address = new Address();
        address.setUser(user);
        updateAddressFromRequest(address, request);

        if (Boolean.TRUE.equals(request.isDefault())) {
            clearOtherDefaults(user);
        } else {
            // If it's the first address, make it default
            if (addressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(user).isEmpty()) {
                address.setIsDefault(true);
            }
        }

        Address saved = addressRepository.save(address);
        return toDto(saved);
    }

    @Transactional
    public AddressDto updateAddress(Long id, AddressRequest request, String username) {
        User user = getUserByUsername(username);
        Address address = addressRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));

        updateAddressFromRequest(address, request);

        if (Boolean.TRUE.equals(request.isDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            clearOtherDefaults(user);
            address.setIsDefault(true);
        }

        Address saved = addressRepository.save(address);
        return toDto(saved);
    }

    @Transactional
    public void deleteAddress(Long id, String username) {
        User user = getUserByUsername(username);
        Address address = addressRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        
        boolean wasDefault = address.getIsDefault();
        addressRepository.delete(address);

        if (wasDefault) {
            // assign a new default if another address exists
            List<Address> remaining = addressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(user);
            if (!remaining.isEmpty()) {
                Address newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
            }
        }
    }

    @Transactional
    public AddressDto setDefaultAddress(Long id, String username) {
        User user = getUserByUsername(username);
        Address address = addressRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));

        clearOtherDefaults(user);
        address.setIsDefault(true);
        Address saved = addressRepository.save(address);
        return toDto(saved);
    }

    private void clearOtherDefaults(User user) {
        List<Address> defaultAddresses = addressRepository.findByUserAndIsDefaultTrue(user);
        for (Address addr : defaultAddresses) {
            addr.setIsDefault(false);
            addressRepository.save(addr);
        }
    }

    private void updateAddressFromRequest(Address address, AddressRequest request) {
        if (request.type() != null) address.setType(request.type());
        if (request.recipientName() != null) address.setRecipientName(request.recipientName());
        if (request.phoneNumber() != null) address.setPhoneNumber(request.phoneNumber());
        if (request.addressLine1() != null) address.setAddressLine1(request.addressLine1());
        address.setAddressLine2(request.addressLine2());
        if (request.city() != null) address.setCity(request.city());
        if (request.state() != null) address.setState(request.state());
        if (request.pinCode() != null) address.setPinCode(request.pinCode());
        if (request.latitude() != null) address.setLatitude(request.latitude());
        if (request.longitude() != null) address.setLongitude(request.longitude());
        if (request.isDefault() != null) address.setIsDefault(request.isDefault());
    }

    public AddressDto toDto(Address address) {
        boolean serviceable = serviceabilityService.isServiceable(address);
        String reason = serviceable ? null : serviceabilityService.getUnserviceableReason(address);
        return AddressDto.from(address, serviceable, reason);
    }
}
