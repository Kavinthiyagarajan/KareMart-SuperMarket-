package com.example.supermarket.service;

import com.example.supermarket.dto.CartItemDto;
import com.example.supermarket.dto.CheckoutError;
import com.example.supermarket.dto.CheckoutRequest;
import com.example.supermarket.dto.CheckoutResponse;
import com.example.supermarket.model.Order;
import com.example.supermarket.model.OrderItem;
import com.example.supermarket.model.Product;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import com.example.supermarket.repository.AddressRepository;
import com.example.supermarket.repository.UserRepository;
import com.example.supermarket.model.Address;
import com.example.supermarket.model.User;
import java.util.UUID;

@Service
public class CheckoutService {
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final ServiceabilityService serviceabilityService;
    private final InventoryReservationService inventoryReservationService;
    private final PromotionService promotionService;
    private final CartService cartService;
    private final InventoryAuditService inventoryAuditService;

    @org.springframework.beans.factory.annotation.Value("${order.payment-expiration-minutes:15}")
    private int expirationMinutes;

    public CheckoutService(ProductRepository productRepository, OrderRepository orderRepository,
                           AddressRepository addressRepository, UserRepository userRepository,
                           ServiceabilityService serviceabilityService,
                           InventoryReservationService inventoryReservationService,
                           PromotionService promotionService,
                           CartService cartService,
                           InventoryAuditService inventoryAuditService) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.serviceabilityService = serviceabilityService;
        this.inventoryReservationService = inventoryReservationService;
        this.promotionService = promotionService;
        this.cartService = cartService;
        this.inventoryAuditService = inventoryAuditService;
    }

    public CheckoutResponse validateCheckout(CheckoutRequest request, String username) {
        List<CheckoutError> errors = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItemDto item : request.items()) {
            Product product = productRepository.findById(item.productId()).orElse(null);

            if (product == null) {
                errors.add(new CheckoutError(item.productId(), "Product not found", "NOT_FOUND"));
                continue;
            }

            if (!"IN_STOCK".equals(product.getAvailabilityStatus())) {
                errors.add(new CheckoutError(item.productId(), "Product is out of stock", "OUT_OF_STOCK"));
                continue;
            }

            if (product.getAvailableQuantity() < item.quantity()) {
                errors.add(new CheckoutError(item.productId(), "Requested quantity exceeds available stock", "QUANTITY_EXCEEDED"));
                continue;
            }

            BigDecimal lineTotal = product.getSellingPrice().multiply(BigDecimal.valueOf(item.quantity()));
            subtotal = subtotal.add(lineTotal);
        }

        BigDecimal discount = BigDecimal.ZERO;
        String couponCode = null;

        if (request.couponCode() != null && !request.couponCode().trim().isEmpty()) {
            com.example.supermarket.dto.CouponValidationResult validationResult = promotionService.validateCoupon(request.couponCode(), subtotal, username);
            if (validationResult.valid()) {
                discount = validationResult.discountAmount();
                couponCode = validationResult.normalizedCode();
            } else {
                errors.add(new CheckoutError(0L, validationResult.errorMessage(), "INVALID_COUPON"));
            }
        }

        BigDecimal taxableAmount = subtotal.subtract(discount);
        if (taxableAmount.compareTo(BigDecimal.ZERO) < 0) {
            taxableAmount = BigDecimal.ZERO;
        }

        BigDecimal tax = taxableAmount.multiply(new BigDecimal("0.05")); // 5% flat tax
        BigDecimal total = taxableAmount.add(tax);

        // Address Validation
        if (request.addressId() != null && username != null && !"GUEST".equals(username)) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                Address address = addressRepository.findByIdAndUser(request.addressId(), user).orElse(null);
                if (address == null) {
                    errors.add(new CheckoutError(0L, "Selected address not found or unauthorized", "ADDRESS_INVALID"));
                } else if (!serviceabilityService.isServiceable(address)) {
                    errors.add(new CheckoutError(0L, serviceabilityService.getUnserviceableReason(address), "UNSERVICEABLE_ADDRESS"));
                }
            }
        }

        String checkoutToken = errors.isEmpty() ? UUID.randomUUID().toString() : null;

        return new CheckoutResponse(errors.isEmpty(), checkoutToken, subtotal, discount, tax, total, couponCode, errors);
    }

    @Transactional
    public Order placeOrder(CheckoutRequest request, String customerId) {
        CheckoutResponse validation = validateCheckout(request, customerId);

        if (!validation.success()) {
            throw new RuntimeException("Checkout validation failed: " + 
                validation.errors().stream().map(com.example.supermarket.dto.CheckoutError::message).toList());
        }

        Order order = new Order();
        order.setOrderNumber(UUID.randomUUID().toString());
        order.setCustomerId(customerId);
        order.setStatus("PENDING_PAYMENT");
        order.setSubtotal(validation.subtotal());
        order.setDiscount(validation.discount());
        order.setCouponCode(validation.couponCode());
        order.setTax(validation.tax());
        order.setTotal(validation.total());

        // Sort to prevent deadlocks
        List<CartItemDto> sortedItems = request.items().stream()
                .sorted(java.util.Comparator.comparing(CartItemDto::productId))
                .toList();

        for (CartItemDto itemDto : sortedItems) {
            Product product = productRepository.findByIdForUpdate(itemDto.productId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            
            if (!"IN_STOCK".equals(product.getAvailabilityStatus()) || product.getAvailableQuantity() < itemDto.quantity()) {
                throw new RuntimeException("Insufficient stock for product " + product.getName() + " during reservation.");
            }

            // Decrement stock strictly under lock
            int prevStock = product.getAvailableQuantity();
            product.setAvailableQuantity(prevStock - itemDto.quantity());
            if (product.getAvailableQuantity() == 0) {
                product.setAvailabilityStatus("OUT_OF_STOCK");
            }
            productRepository.save(product);
            
            inventoryAuditService.recordAudit(product, -itemDto.quantity(), prevStock, product.getAvailableQuantity(), 
                com.example.supermarket.model.TransactionType.ORDER_RESERVATION, "Order Placed", order.getOrderNumber(), customerId);

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setExternalProductId(product.getExternalId());
            orderItem.setQuantity(itemDto.quantity());
            orderItem.setUnitPrice(product.getSellingPrice());
            orderItem.setMrp(product.getMrp());
            orderItem.setDiscount(product.getDiscountPercent() != null ? product.getDiscountPercent() : BigDecimal.ZERO);
            orderItem.setTotalPrice(product.getSellingPrice().multiply(BigDecimal.valueOf(itemDto.quantity())));
            
            order.addItem(orderItem);
        }

        if (validation.couponCode() != null) {
            promotionService.recordUsage(validation.couponCode(), customerId, order.getOrderNumber());
        }

        Order savedOrder = orderRepository.save(order);

        java.time.ZonedDateTime expiresAt = java.time.ZonedDateTime.now().plusMinutes(expirationMinutes);
        inventoryReservationService.reserveStock(savedOrder, expiresAt);

        if (customerId != null && !"GUEST".equals(customerId)) {
            cartService.clearCart(customerId);
        }

        return savedOrder;
    }
}
