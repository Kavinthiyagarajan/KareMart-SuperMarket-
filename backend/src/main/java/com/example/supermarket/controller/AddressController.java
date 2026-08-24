package com.example.supermarket.controller;

import com.example.supermarket.dto.AddressDto;
import com.example.supermarket.dto.AddressRequest;
import com.example.supermarket.service.AddressService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public ResponseEntity<List<AddressDto>> getMyAddresses(Principal principal) {
        return ResponseEntity.ok(addressService.getMyAddresses(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<AddressDto> createAddress(@RequestBody AddressRequest request, Principal principal) {
        return ResponseEntity.ok(addressService.createAddress(request, principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AddressDto> getAddress(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(addressService.getAddress(id, principal.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressDto> updateAddress(@PathVariable Long id, @RequestBody AddressRequest request, Principal principal) {
        return ResponseEntity.ok(addressService.updateAddress(id, request, principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id, Principal principal) {
        addressService.deleteAddress(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<AddressDto> setDefaultAddress(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(addressService.setDefaultAddress(id, principal.getName()));
    }

    @GetMapping("/{id}/serviceability")
    public ResponseEntity<Map<String, Object>> checkServiceability(@PathVariable Long id, Principal principal) {
        AddressDto dto = addressService.getAddress(id, principal.getName());
        return ResponseEntity.ok(Map.of(
            "serviceable", dto.isServiceable(),
            "message", dto.unserviceableReason() == null ? "Serviceable" : dto.unserviceableReason()
        ));
    }
}
