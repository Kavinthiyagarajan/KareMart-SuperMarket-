package com.example.supermarket.integration;

import com.example.supermarket.dto.CheckoutRequest;
import com.example.supermarket.dto.CartItemDto;
import com.example.supermarket.dto.StockUpdateRequest;
import com.example.supermarket.model.InventoryTransaction;
import com.example.supermarket.model.Product;
import com.example.supermarket.model.TransactionType;
import com.example.supermarket.repository.InventoryTransactionRepository;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.service.CheckoutService;
import com.example.supermarket.service.InventoryReservationService;
import com.example.supermarket.service.OrderExpirationJob;
import com.example.supermarket.service.ProductService;
import com.example.supermarket.model.Order;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import com.example.supermarket.repository.UserRepository;
import com.example.supermarket.model.User;
import com.example.supermarket.model.Role;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
public class InventoryAuditIntegrationTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private InventoryReservationService inventoryReservationService;

    @Autowired
    private OrderExpirationJob orderExpirationJob;

    @Autowired
    private MockMvc mockMvc;

    private Product testProduct;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();

        Product product = new Product();
        product.setName("Audit Test Product");
        product.setSlug("audit-test-product");
        product.setSku("AT-100");
        product.setBarcode("1234567890123");
        product.setBrand("BrandA");
        product.setExternalId("EXT-" + System.currentTimeMillis());
        product.setSource("SYSTEM");
        product.setSellingPrice(new BigDecimal("100.00"));
        product.setMrp(new BigDecimal("100.00"));
        product.setAvailableQuantity(50);
        product.setAvailabilityStatus("IN_STOCK");
        product.setActive(true);
        testProduct = productRepository.save(product);

        if (userRepository.findByUsername("customer1").isEmpty()) {
            User customer = new User();
            customer.setUsername("customer1");
            customer.setPassword("password");
            customer.setRole(Role.CUSTOMER);
            userRepository.save(customer);
        }

        if (userRepository.findByUsername("admin1").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin1");
            admin.setPassword("password");
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
        }
    }

    @Test
    void testAdminAddCreatesAuditRecord() {
        productService.updateStock(testProduct.getId(), new StockUpdateRequest("ADD", 10), "admin_user");
        
        List<InventoryTransaction> txs = transactionRepository.findAll();
        assertEquals(1, txs.size());
        InventoryTransaction tx = txs.get(0);
        assertEquals(TransactionType.ADMIN_ADD, tx.getTransactionType());
        assertEquals(10, tx.getQuantityChange());
        assertEquals(50, tx.getPreviousStock());
        assertEquals(60, tx.getResultingStock());
        assertEquals("admin_user", tx.getActorUsername());
    }

    @Test
    void testAdminSubtractCreatesAuditRecord() {
        productService.updateStock(testProduct.getId(), new StockUpdateRequest("SUBTRACT", 5), "admin_user");
        
        List<InventoryTransaction> txs = transactionRepository.findAll();
        assertEquals(1, txs.size());
        InventoryTransaction tx = txs.get(0);
        assertEquals(TransactionType.ADMIN_SUBTRACT, tx.getTransactionType());
        assertEquals(-5, tx.getQuantityChange());
        assertEquals(50, tx.getPreviousStock());
        assertEquals(45, tx.getResultingStock());
    }

    @Test
    void testAdminSetCreatesAuditRecord() {
        productService.updateStock(testProduct.getId(), new StockUpdateRequest("SET", 100), "admin_user");
        
        List<InventoryTransaction> txs = transactionRepository.findAll();
        assertEquals(1, txs.size());
        InventoryTransaction tx = txs.get(0);
        assertEquals(TransactionType.ADMIN_SET, tx.getTransactionType());
        assertEquals(50, tx.getQuantityChange());
        assertEquals(50, tx.getPreviousStock());
        assertEquals(100, tx.getResultingStock());
    }

    @Test
    void testOrderReservationCreatesAuditRecord() {
        CheckoutRequest request = new CheckoutRequest(
            List.of(new CartItemDto(testProduct.getId(), 2)),
            null,
            null
        );
        Order order = checkoutService.placeOrder(request, "customer1");

        List<InventoryTransaction> txs = transactionRepository.findAll();
        assertEquals(1, txs.size());
        InventoryTransaction tx = txs.get(0);
        assertEquals(TransactionType.ORDER_RESERVATION, tx.getTransactionType());
        assertEquals(-2, tx.getQuantityChange());
        assertEquals(50, tx.getPreviousStock());
        assertEquals(48, tx.getResultingStock());
        assertEquals(order.getOrderNumber(), tx.getOrderNumber());
        assertEquals("customer1", tx.getActorUsername());
    }

    @Test
    void testReservationReleaseCreatesAuditRecord() {
        CheckoutRequest request = new CheckoutRequest(
            List.of(new CartItemDto(testProduct.getId(), 3)),
            null,
            null
        );
        Order order = checkoutService.placeOrder(request, "customer1");

        transactionRepository.deleteAll(); // clear reservation audit for clear check

        inventoryReservationService.releaseReservations(order.getOrderNumber(), com.example.supermarket.model.ReservationStatus.RELEASED);

        List<InventoryTransaction> txs = transactionRepository.findAll();
        assertEquals(1, txs.size());
        InventoryTransaction tx = txs.get(0);
        assertEquals(TransactionType.RESERVATION_RELEASE, tx.getTransactionType());
        assertEquals(3, tx.getQuantityChange());
        assertEquals(47, tx.getPreviousStock());
        assertEquals(50, tx.getResultingStock());
    }

    @Test
    void testExpirationJobCreatesAuditRecord() {
        CheckoutRequest request = new CheckoutRequest(
            List.of(new CartItemDto(testProduct.getId(), 5)),
            null,
            null
        );
        Order order = checkoutService.placeOrder(request, "customer1");

        transactionRepository.deleteAll(); // clear reservation audit

        orderExpirationJob.expireOrder(order.getOrderNumber());

        List<InventoryTransaction> txs = transactionRepository.findAll();
        assertEquals(1, txs.size());
        InventoryTransaction tx = txs.get(0);
        assertEquals(TransactionType.RESERVATION_RELEASE, tx.getTransactionType());
        assertEquals(5, tx.getQuantityChange());
        assertEquals(45, tx.getPreviousStock());
        assertEquals(50, tx.getResultingStock());
        
        // Test idempotent duplicate release
        transactionRepository.deleteAll();
        orderExpirationJob.expireOrder(order.getOrderNumber());
        assertEquals(0, transactionRepository.findAll().size()); // No new audit on duplicate expiration
    }

    @Test
    @WithMockUser(username = "customer1", roles = "CUSTOMER")
    void testCustomerCannotAccessAuditApi() throws Exception {
        mockMvc.perform(get("/api/v1/admin/inventory/history"))
               .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void testAdminCanAccessAuditApiAndFiltersWork() throws Exception {
        productService.updateStock(testProduct.getId(), new StockUpdateRequest("ADD", 10), "admin1");

        mockMvc.perform(get("/api/v1/admin/inventory/history")
                   .param("productId", testProduct.getId().toString())
                   .param("transactionType", "ADMIN_ADD"))
               .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
               .andExpect(status().isOk());
    }
}
