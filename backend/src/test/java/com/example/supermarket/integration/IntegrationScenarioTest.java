package com.example.supermarket.integration;

import com.example.supermarket.dto.CheckoutRequest;
import com.example.supermarket.dto.PaymentCreationRequest;
import com.example.supermarket.dto.CartItemDto;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.AddressRepository;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.repository.UserRepository;
import com.example.supermarket.service.CheckoutService;
import com.example.supermarket.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class IntegrationScenarioTest {

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Test
    @Transactional
    public void testCustomerOrderLifecycle() {
        // Step 0: Setup Data
        User user = new User();
        user.setUsername("testuser");
        user.setPassword("pass");
        user.setRole(Role.CUSTOMER);
        user = userRepository.save(user);

        Address address = new Address();
        address.setUser(user);
        address.setType(AddressType.HOME);
        address.setRecipientName("Test User");
        address.setAddressLine1("123 Test St");
        address.setCity("Test City");
        address.setState("TS");
        address.setPinCode("123456");
        address.setPhoneNumber("1234567890");
        address = addressRepository.save(address);

        Product product = new Product();
        product.setExternalId("TEST-PROD-1");
        product.setName("Test Product");
        product.setSlug("test-product");
        product.setSellingPrice(new BigDecimal("100.00"));
        product.setMrp(new BigDecimal("150.00"));
        product.setAvailableQuantity(50);
        product.setAvailabilityStatus("IN_STOCK");
        product.setSource("MANUAL");
        product.setActive(true);
        product = productRepository.save(product);

        // Step 1: Create a Checkout Request
        CheckoutRequest request = new CheckoutRequest(
                List.of(new CartItemDto(product.getId(), 2)), // Product ID, Qty 2
                address.getId(), // addressId
                null // couponCode
        );

        // Step 2: Checkout (Order is created, Inventory reserved, status PENDING_PAYMENT)
        Order order = checkoutService.placeOrder(request, "testuser");
        assertNotNull(order);
        assertEquals("PENDING_PAYMENT", order.getStatus());
        assertEquals("testuser", order.getCustomerId());

        // Step 3: Payment Request
        PaymentCreationRequest paymentRequest = new PaymentCreationRequest(
                order.getOrderNumber(),
                PaymentMethod.COD,
                "idemp-12345"
        );

        // Step 4: Process Payment (Order becomes CONFIRMED, Delivery is created)
        paymentService.createPayment(paymentRequest, "testuser");

        // Verify Order is CONFIRMED
        Order confirmedOrder = orderRepository.findByOrderNumber(order.getOrderNumber()).orElseThrow();
        assertEquals("CONFIRMED", confirmedOrder.getStatus());
    }
}
