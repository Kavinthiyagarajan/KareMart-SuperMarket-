package com.example.supermarket.service;

import com.example.supermarket.dto.AddressDto;
import com.example.supermarket.dto.AddressRequest;
import com.example.supermarket.model.Address;
import com.example.supermarket.model.AddressType;
import com.example.supermarket.model.User;
import com.example.supermarket.repository.AddressRepository;
import com.example.supermarket.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AddressServiceTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ServiceabilityService serviceabilityService;

    @InjectMocks
    private AddressService addressService;

    private User testUser;
    private Address testAddress;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testAddress = new Address();
        testAddress.setId(100L);
        testAddress.setUser(testUser);
        testAddress.setType(AddressType.HOME);
        testAddress.setRecipientName("John Doe");
        testAddress.setPinCode("123456");
        testAddress.setIsDefault(true);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(serviceabilityService.isServiceable(any(Address.class))).thenReturn(true);
    }

    @Test
    void createAddress_success() {
        AddressRequest req = new AddressRequest(AddressType.WORK, "Jane Doe", "9876543210", "Line 1", null, "City", "State", "654321", null, null, true);
        
        when(addressRepository.save(any(Address.class))).thenAnswer(i -> {
            Address a = i.getArgument(0);
            a.setId(101L);
            return a;
        });
        when(addressRepository.findByUserAndIsDefaultTrue(testUser)).thenReturn(List.of(testAddress));

        AddressDto result = addressService.createAddress(req, "testuser");

        assertNotNull(result);
        assertEquals(101L, result.id());
        assertTrue(result.isDefault());
        verify(addressRepository, times(1)).save(testAddress); // to clear old default
        verify(addressRepository, times(2)).save(any(Address.class)); // one for old default, one for new
    }

    @Test
    void getMyAddresses_returnsOnlyMyAddresses() {
        when(addressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(testUser)).thenReturn(List.of(testAddress));
        
        List<AddressDto> results = addressService.getMyAddresses("testuser");
        
        assertEquals(1, results.size());
        assertEquals(100L, results.get(0).id());
    }

    @Test
    void getAddress_wrongUser_throwsException() {
        when(addressRepository.findByIdAndUser(100L, testUser)).thenReturn(Optional.empty());

        Exception e = assertThrows(RuntimeException.class, () -> addressService.getAddress(100L, "testuser"));
        assertEquals("Address not found", e.getMessage());
    }

    @Test
    void deleteAddress_assignsNewDefault() {
        when(addressRepository.findByIdAndUser(100L, testUser)).thenReturn(Optional.of(testAddress));
        Address nextAddr = new Address();
        nextAddr.setId(102L);
        nextAddr.setIsDefault(false);
        when(addressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(testUser)).thenReturn(List.of(nextAddr));

        addressService.deleteAddress(100L, "testuser");

        verify(addressRepository, times(1)).delete(testAddress);
        assertTrue(nextAddr.getIsDefault());
        verify(addressRepository, times(1)).save(nextAddr);
    }
}
