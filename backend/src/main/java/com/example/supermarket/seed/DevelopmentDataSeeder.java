package com.example.supermarket.seed;

import com.example.supermarket.integration.supermarket.ExternalProduct;
import com.example.supermarket.integration.supermarket.MockSupermarketProvider;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.*;
import com.example.supermarket.service.InventorySyncService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Configuration
@Profile({"dev", "default", "local"})
public class DevelopmentDataSeeder {

    @Bean
    public CommandLineRunner seedData(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            InventorySyncService inventorySyncService,
            CouponRepository couponRepository,
            AddressRepository addressRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            WishlistItemRepository wishlistItemRepository,
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            DeliveryRepository deliveryRepository,
            ReviewRepository reviewRepository,
            NotificationRepository notificationRepository,
            SupportConversationRepository supportConversationRepository,
            SupportMessageRepository supportMessageRepository,
            ReturnRequestRepository returnRequestRepository,
            CancellationRequestRepository cancellationRequestRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            DeliveryClusterRepository deliveryClusterRepository,
            DeliveryClusterItemRepository deliveryClusterItemRepository) {
        return args -> {
            seedUsers(userRepository, passwordEncoder);
            seedCategories(categoryRepository);
            seedProducts(inventorySyncService, productRepository);
            seedCoupons(couponRepository);

            User demoCustomer = userRepository.findByUsername("demo.customer").orElseThrow();
            seedAddresses(addressRepository, demoCustomer);
            seedCart(cartRepository, cartItemRepository, demoCustomer, productRepository);
            seedWishlist(wishlistItemRepository, demoCustomer, productRepository);
            seedOrders(orderRepository, demoCustomer, productRepository);
            seedPayments(paymentRepository, orderRepository);
            seedDeliveries(deliveryRepository, orderRepository);
            seedReviews(reviewRepository, demoCustomer, productRepository);
            seedNotifications(notificationRepository, demoCustomer);
            seedSupportConversations(supportConversationRepository, supportMessageRepository, demoCustomer, userRepository, productRepository);
            seedReturnsAndCancellations(returnRequestRepository, cancellationRequestRepository, demoCustomer, orderRepository);
            seedInventoryHistory(inventoryTransactionRepository, productRepository);
            seedDeliveryClusters(deliveryClusterRepository, deliveryClusterItemRepository, deliveryRepository);
        };
    }

    @Transactional
    public void seedUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        if (userRepository.findByUsername("demo.admin").isEmpty()) {
            User admin = new User("demo.admin", passwordEncoder.encode("adminpass"), Role.ADMIN);
            userRepository.save(admin);
        }
        if (userRepository.findByUsername("demo.customer").isEmpty()) {
            User cust = new User("demo.customer", passwordEncoder.encode("custpass"), Role.CUSTOMER);
            userRepository.save(cust);
        }
        if (userRepository.findByUsername("demo.customer2").isEmpty()) {
            User cust2 = new User("demo.customer2", passwordEncoder.encode("cust2pass"), Role.CUSTOMER);
            userRepository.save(cust2);
        }
    }

    @Transactional
    public void seedCategories(CategoryRepository categoryRepository) {
        String[] names = {
                "Staples",
                "Snacks",
                "Biscuits",
                "Beverages",
                "Breakfast",
                "Instant Foods",
                "Cooking Essentials",
                "Personal Care",
                "Household"
        };
        for (String name : names) {
            String slug = name.toLowerCase().replace(" ", "-");
            if (categoryRepository.findBySlug(slug).isEmpty()) {
                Category c = new Category();
                c.setName(name);
                c.setSlug(slug);
                categoryRepository.save(c);
            }
        }
    }

    @Transactional
    public void seedProducts(InventorySyncService inventorySyncService, ProductRepository productRepository) {
        for (ExternalProduct ep : MockSupermarketProvider.MOCK_PRODUCTS) {
            if (productRepository.findByExternalId(ep.externalId()).isEmpty()) {
                try {
                    inventorySyncService.syncProduct(ep.externalId());
                } catch (Exception e) {
                    // Fallback to allow next items
                }
            }
        }
        // Ensure at least one product is set to inactive for admin product management testing
        productRepository.findByExternalId("EXT-135").ifPresent(p -> {
            if (p.getActive() == null || p.getActive()) {
                p.setActive(false);
                productRepository.save(p);
            }
        });
    }

    @Transactional
    public void seedCoupons(CouponRepository couponRepository) {
        // Explicit required development coupons
        createCouponIfAbsent(couponRepository, "KARE10", "10% off on all items", DiscountType.PERCENTAGE, new BigDecimal("10.00"), new BigDecimal("100.00"), null, 500, 2, ZonedDateTime.now().minusDays(30), ZonedDateTime.now().plusYears(1), true);
        createCouponIfAbsent(couponRepository, "SAVE100", "Flat ₹100 discount on orders above ₹500", DiscountType.FIXED_AMOUNT, new BigDecimal("100.00"), new BigDecimal("500.00"), null, 200, 1, ZonedDateTime.now().minusDays(15), ZonedDateTime.now().plusYears(1), true);
        createCouponIfAbsent(couponRepository, "MAX50", "20% off up to maximum ₹50 discount", DiscountType.PERCENTAGE, new BigDecimal("20.00"), new BigDecimal("200.00"), new BigDecimal("50.00"), 300, 2, ZonedDateTime.now().minusDays(10), ZonedDateTime.now().plusYears(1), true);
        createCouponIfAbsent(couponRepository, "EXPIRED10", "10% off promotional discount (Expired)", DiscountType.PERCENTAGE, new BigDecimal("10.00"), new BigDecimal("100.00"), null, 50, 1, ZonedDateTime.now().minusDays(60), ZonedDateTime.now().minusDays(10), true);
        createCouponIfAbsent(couponRepository, "INACTIVE20", "20% off seasonal promotion (Inactive)", DiscountType.PERCENTAGE, new BigDecimal("20.00"), new BigDecimal("100.00"), null, 50, 1, ZonedDateTime.now().minusDays(5), ZonedDateTime.now().plusYears(1), false);

        // Additional test coupons
        createCouponIfAbsent(couponRepository, "WELCOME10", "10% off for new customers", DiscountType.PERCENTAGE, new BigDecimal("10.00"), new BigDecimal("100.00"), null, 100, 1, ZonedDateTime.now().minusDays(30), ZonedDateTime.now().plusYears(1), true);
        createCouponIfAbsent(couponRepository, "SAVE15", "15% off on orders above ₹200", DiscountType.PERCENTAGE, new BigDecimal("15.00"), new BigDecimal("200.00"), null, 200, 2, ZonedDateTime.now().minusDays(15), ZonedDateTime.now().plusYears(1), true);
        createCouponIfAbsent(couponRepository, "FLAT50", "Flat ₹50 off on orders above ₹300", DiscountType.FIXED_AMOUNT, new BigDecimal("50.00"), new BigDecimal("300.00"), null, 150, 1, ZonedDateTime.now().minusDays(10), ZonedDateTime.now().plusYears(1), true);
        createCouponIfAbsent(couponRepository, "SUPER25", "25% off up to max ₹100 discount", DiscountType.PERCENTAGE, new BigDecimal("25.00"), new BigDecimal("250.00"), new BigDecimal("100.00"), 300, 2, ZonedDateTime.now().minusDays(5), ZonedDateTime.now().plusYears(1), true);
    }

    private void createCouponIfAbsent(CouponRepository repo, String code, String desc, DiscountType type, BigDecimal value, BigDecimal minOrder, BigDecimal maxDiscount, Integer limit, Integer perCustLimit, ZonedDateTime validFrom, ZonedDateTime validUntil, Boolean active) {
        if (repo.findByCode(code).isEmpty()) {
            Coupon c = new Coupon();
            c.setCode(code);
            c.setDescription(desc);
            c.setDiscountType(type);
            c.setDiscountValue(value);
            c.setMinOrderValue(minOrder);
            c.setMaxDiscount(maxDiscount);
            c.setUsageLimit(limit);
            c.setPerCustomerLimit(perCustLimit);
            c.setCurrentUsage(0);
            c.setValidFrom(validFrom);
            c.setValidUntil(validUntil);
            c.setActive(active);
            repo.save(c);
        }
    }

    @Transactional
    public void seedAddresses(AddressRepository addressRepository, User user) {
        if (addressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(user).isEmpty()) {
            Address a1 = new Address();
            a1.setUser(user);
            a1.setType(AddressType.HOME);
            a1.setRecipientName("Demo Customer");
            a1.setPhoneNumber("9876543210");
            a1.setAddressLine1("Flat 402, Green Meadows");
            a1.setAddressLine2("1st Cross, Tech Park Road");
            a1.setCity("Bengaluru");
            a1.setState("Karnataka");
            a1.setPinCode("560103");
            a1.setIsDefault(true);
            addressRepository.save(a1);

            Address a2 = new Address();
            a2.setUser(user);
            a2.setType(AddressType.WORK);
            a2.setRecipientName("Demo Customer");
            a2.setPhoneNumber("9876543210");
            a2.setAddressLine1("Tower B, Level 6");
            a2.setAddressLine2("Cyber City, Phase 2");
            a2.setCity("Bengaluru");
            a2.setState("Karnataka");
            a2.setPinCode("560100");
            a2.setIsDefault(false);
            addressRepository.save(a2);
        }
    }

    @Transactional
    public void seedCart(CartRepository cartRepo, CartItemRepository cartItemRepo, User user, ProductRepository productRepo) {
        Cart cart = cartRepo.findByUser(user).orElseGet(() -> {
            Cart c = new Cart();
            c.setUser(user);
            return cartRepo.save(c);
        });

        addCartItemIfAbsent(cartRepo, cartItemRepo, cart, productRepo, "EXT-102", 1);
        addCartItemIfAbsent(cartRepo, cartItemRepo, cart, productRepo, "EXT-114", 2);
        addCartItemIfAbsent(cartRepo, cartItemRepo, cart, productRepo, "EXT-111", 1);
        addCartItemIfAbsent(cartRepo, cartItemRepo, cart, productRepo, "EXT-116", 2);
    }

    private void addCartItemIfAbsent(CartRepository cartRepo, CartItemRepository cartItemRepo, Cart cart, ProductRepository productRepo, String externalId, int qty) {
        Optional<Product> pOpt = productRepo.findByExternalId(externalId);
        if (pOpt.isPresent()) {
            Product p = pOpt.get();
            if (cartItemRepo.findByCartAndProduct(cart, p).isEmpty()) {
                CartItem ci = new CartItem();
                ci.setCart(cart);
                ci.setProduct(p);
                ci.setQuantity(qty);
                cartItemRepo.save(ci);
            }
        }
    }

    @Transactional
    public void seedWishlist(WishlistItemRepository wishRepo, User user, ProductRepository productRepo) {
        addWishlistIfAbsent(wishRepo, user, productRepo, "EXT-101");
        addWishlistIfAbsent(wishRepo, user, productRepo, "EXT-109");
        addWishlistIfAbsent(wishRepo, user, productRepo, "EXT-121");
        addWishlistIfAbsent(wishRepo, user, productRepo, "EXT-123");
        addWishlistIfAbsent(wishRepo, user, productRepo, "EXT-106");
    }

    private void addWishlistIfAbsent(WishlistItemRepository wishRepo, User user, ProductRepository productRepo, String externalId) {
        productRepo.findByExternalId(externalId).ifPresent(p -> {
            if (wishRepo.findByUserAndProductId(user, p.getId()).isEmpty()) {
                WishlistItem item = new WishlistItem(user, p);
                wishRepo.save(item);
            }
        });
    }

    @Transactional
    public void seedOrders(OrderRepository orderRepo, User user, ProductRepository productRepo) {
        String username = user.getUsername();

        // ORD-DEMO-001: DELIVERED
        Optional<Order> o1Opt = orderRepo.findByOrderNumber("ORD-DEMO-001");
        if (o1Opt.isEmpty()) {
            Order o1 = new Order();
            o1.setOrderNumber("ORD-DEMO-001");
            o1.setCustomerId(username);
            o1.setStatus("DELIVERED");

            Product p1 = productRepo.findByExternalId("EXT-101").orElseThrow();
            Product p2 = productRepo.findByExternalId("EXT-102").orElseThrow();
            Product p3 = productRepo.findByExternalId("EXT-103").orElseThrow();

            addOrderItem(o1, p1, 2);
            addOrderItem(o1, p2, 1);
            addOrderItem(o1, p3, 2);

            BigDecimal subtotal = new BigDecimal("960.00");
            BigDecimal tax = new BigDecimal("48.00");
            o1.setSubtotal(subtotal);
            o1.setTax(tax);
            o1.setTotal(subtotal.add(tax));
            orderRepo.save(o1);
        } else {
            Order o1 = o1Opt.get();
            if (!username.equals(o1.getCustomerId())) {
                o1.setCustomerId(username);
                orderRepo.save(o1);
            }
        }

        // ORD-DEMO-002: CONFIRMED
        Optional<Order> o2Opt = orderRepo.findByOrderNumber("ORD-DEMO-002");
        if (o2Opt.isEmpty()) {
            Order o2 = new Order();
            o2.setOrderNumber("ORD-DEMO-002");
            o2.setCustomerId(username);
            o2.setStatus("CONFIRMED");

            Product p1 = productRepo.findByExternalId("EXT-109").orElseThrow();
            Product p2 = productRepo.findByExternalId("EXT-108").orElseThrow();
            Product p3 = productRepo.findByExternalId("EXT-106").orElseThrow();

            addOrderItem(o2, p1, 1);
            addOrderItem(o2, p2, 2);
            addOrderItem(o2, p3, 2);

            BigDecimal subtotal = new BigDecimal("970.00");
            BigDecimal tax = new BigDecimal("48.50");
            o2.setSubtotal(subtotal);
            o2.setTax(tax);
            o2.setTotal(subtotal.add(tax));
            orderRepo.save(o2);
        } else {
            Order o2 = o2Opt.get();
            if (!username.equals(o2.getCustomerId())) {
                o2.setCustomerId(username);
                orderRepo.save(o2);
            }
        }

        // ORD-DEMO-003: CANCELLED
        Optional<Order> o3Opt = orderRepo.findByOrderNumber("ORD-DEMO-003");
        if (o3Opt.isEmpty()) {
            Order o3 = new Order();
            o3.setOrderNumber("ORD-DEMO-003");
            o3.setCustomerId(username);
            o3.setStatus("CANCELLED");

            Product p1 = productRepo.findByExternalId("EXT-105").orElseThrow();
            Product p2 = productRepo.findByExternalId("EXT-104").orElseThrow();

            addOrderItem(o3, p1, 2);
            addOrderItem(o3, p2, 3);

            BigDecimal subtotal = new BigDecimal("210.00");
            BigDecimal tax = new BigDecimal("10.50");
            o3.setSubtotal(subtotal);
            o3.setTax(tax);
            o3.setTotal(subtotal.add(tax));
            orderRepo.save(o3);
        } else {
            Order o3 = o3Opt.get();
            if (!username.equals(o3.getCustomerId())) {
                o3.setCustomerId(username);
                orderRepo.save(o3);
            }
        }

        // ORD-DEMO-004: PENDING_PAYMENT
        Optional<Order> o4Opt = orderRepo.findByOrderNumber("ORD-DEMO-004");
        if (o4Opt.isEmpty()) {
            Order o4 = new Order();
            o4.setOrderNumber("ORD-DEMO-004");
            o4.setCustomerId(username);
            o4.setStatus("PENDING_PAYMENT");

            Product p1 = productRepo.findByExternalId("EXT-117").orElseThrow();
            Product p2 = productRepo.findByExternalId("EXT-118").orElseThrow();

            addOrderItem(o4, p1, 2);
            addOrderItem(o4, p2, 1);

            BigDecimal subtotal = new BigDecimal("320.00");
            BigDecimal tax = new BigDecimal("16.00");
            o4.setSubtotal(subtotal);
            o4.setTax(tax);
            o4.setTotal(subtotal.add(tax));
            orderRepo.save(o4);
        } else {
            Order o4 = o4Opt.get();
            if (!username.equals(o4.getCustomerId())) {
                o4.setCustomerId(username);
                orderRepo.save(o4);
            }
        }

        // ORD-DEMO-005: DELIVERED
        Optional<Order> o5Opt = orderRepo.findByOrderNumber("ORD-DEMO-005");
        if (o5Opt.isEmpty()) {
            Order o5 = new Order();
            o5.setOrderNumber("ORD-DEMO-005");
            o5.setCustomerId(username);
            o5.setStatus("DELIVERED");

            Product p1 = productRepo.findByExternalId("EXT-122").orElseThrow();
            Product p2 = productRepo.findByExternalId("EXT-120").orElseThrow();
            Product p3 = productRepo.findByExternalId("EXT-123").orElseThrow();

            addOrderItem(o5, p1, 2);
            addOrderItem(o5, p2, 1);
            addOrderItem(o5, p3, 1);

            BigDecimal subtotal = new BigDecimal("710.00");
            BigDecimal tax = new BigDecimal("35.50");
            o5.setSubtotal(subtotal);
            o5.setTax(tax);
            o5.setTotal(subtotal.add(tax));
            orderRepo.save(o5);
        } else {
            Order o5 = o5Opt.get();
            if (!username.equals(o5.getCustomerId())) {
                o5.setCustomerId(username);
                orderRepo.save(o5);
            }
        }
    }

    private void addOrderItem(Order order, Product product, int quantity) {
        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setExternalProductId(product.getExternalId());
        item.setQuantity(quantity);
        item.setUnitPrice(product.getSellingPrice());
        item.setMrp(product.getMrp());
        item.setDiscount(product.getDiscountPercent() != null ? product.getDiscountPercent() : BigDecimal.ZERO);
        item.setTotalPrice(product.getSellingPrice().multiply(BigDecimal.valueOf(quantity)));
        order.addItem(item);
    }

    @Transactional
    public void seedPayments(PaymentRepository paymentRepo, OrderRepository orderRepo) {
        createPaymentIfAbsent(paymentRepo, orderRepo, "ORD-DEMO-001", PaymentStatus.SUCCESS, "idempotency-ord-demo-001");
        createPaymentIfAbsent(paymentRepo, orderRepo, "ORD-DEMO-002", PaymentStatus.SUCCESS, "idempotency-ord-demo-002");
        createPaymentIfAbsent(paymentRepo, orderRepo, "ORD-DEMO-003", PaymentStatus.SUCCESS, "idempotency-ord-demo-003");
        createPaymentIfAbsent(paymentRepo, orderRepo, "ORD-DEMO-004", PaymentStatus.PENDING, "idempotency-ord-demo-004");
        createPaymentIfAbsent(paymentRepo, orderRepo, "ORD-DEMO-005", PaymentStatus.SUCCESS, "idempotency-ord-demo-005");
    }

    private void createPaymentIfAbsent(PaymentRepository paymentRepo, OrderRepository orderRepo, String orderNumber, PaymentStatus status, String idempotencyKey) {
        orderRepo.findByOrderNumber(orderNumber).ifPresent(order -> {
            Optional<Payment> pOpt = paymentRepo.findByOrderNumber(orderNumber);
            if (pOpt.isEmpty()) {
                Payment p = new Payment();
                p.setOrderNumber(order.getOrderNumber());
                p.setCustomerId(order.getCustomerId());
                p.setProvider(PaymentMethod.MOCK);
                p.setAmount(order.getTotal());
                p.setStatus(status);
                p.setPaymentMethod(PaymentMethod.MOCK);
                p.setIdempotencyKey(idempotencyKey);
                paymentRepo.save(p);
            } else {
                Payment p = pOpt.get();
                if (!order.getCustomerId().equals(p.getCustomerId())) {
                    p.setCustomerId(order.getCustomerId());
                    paymentRepo.save(p);
                }
            }
        });
    }

    @Transactional
    public void seedDeliveries(DeliveryRepository deliveryRepo, OrderRepository orderRepo) {
        createDeliveryIfAbsent(deliveryRepo, orderRepo, "ORD-DEMO-001", DeliveryStatus.DELIVERED, 12.9716, 77.5946, ZonedDateTime.now().minusDays(5));
        createDeliveryIfAbsent(deliveryRepo, orderRepo, "ORD-DEMO-002", DeliveryStatus.OUT_FOR_DELIVERY, 12.9780, 77.6010, ZonedDateTime.now().plusMinutes(45));
        createDeliveryIfAbsent(deliveryRepo, orderRepo, "ORD-DEMO-003", DeliveryStatus.CANCELLED, 12.9650, 77.5850, null);
        createDeliveryIfAbsent(deliveryRepo, orderRepo, "ORD-DEMO-005", DeliveryStatus.DELIVERED, 12.9820, 77.6120, ZonedDateTime.now().minusDays(7));
    }

    private void createDeliveryIfAbsent(DeliveryRepository deliveryRepo, OrderRepository orderRepo, String orderNumber, DeliveryStatus status, Double lat, Double lon, ZonedDateTime eta) {
        if (deliveryRepo.findByOrderNumber(orderNumber).isEmpty()) {
            orderRepo.findByOrderNumber(orderNumber).ifPresent(order -> {
                Delivery d = new Delivery();
                d.setOrderNumber(order.getOrderNumber());
                d.setProvider("MOCK_PROVIDER");
                d.setStatus(status);
                d.setLatitude(lat);
                d.setLongitude(lon);
                d.setEstimatedDeliveryTime(eta);
                deliveryRepo.save(d);
            });
        }
    }

    @Transactional
    public void seedReviews(ReviewRepository reviewRepo, User user, ProductRepository productRepo) {
        createReviewIfAbsent(reviewRepo, user.getUsername(), productRepo, "EXT-101", 5, "Excellent aroma and long grain. Perfect for biryani!");
        createReviewIfAbsent(reviewRepo, user.getUsername(), productRepo, "EXT-102", 4, "Makes soft rotis, very good quality flour.");
        createReviewIfAbsent(reviewRepo, user.getUsername(), productRepo, "EXT-103", 3, "Standard quality refined sugar, clean packaging.");
        createReviewIfAbsent(reviewRepo, user.getUsername(), productRepo, "EXT-122", 5, "Fresh mint flavor and long-lasting freshness.");
        createReviewIfAbsent(reviewRepo, user.getUsername(), productRepo, "EXT-120", 4, "Gentle on skin and has a pleasant fragrance.");
    }

    private void createReviewIfAbsent(ReviewRepository reviewRepo, String username, ProductRepository productRepo, String externalId, int rating, String comment) {
        productRepo.findByExternalId(externalId).ifPresent(p -> {
            if (reviewRepo.findByUsernameAndProductId(username, p.getId()).isEmpty()) {
                Review r = new Review();
                r.setUsername(username);
                r.setProductId(p.getId());
                r.setRating(rating);
                r.setComment(comment);
                reviewRepo.save(r);
            }
        });
    }

    @Transactional
    public void seedNotifications(NotificationRepository notifRepo, User user) {
        String username = user.getUsername();
        createNotificationIfAbsent(notifRepo, username, "ORD-DEMO-001", NotificationType.ORDER_CONFIRMED, "Order Confirmed", "Your order ORD-DEMO-001 is confirmed.", true);
        createNotificationIfAbsent(notifRepo, username, "ORD-DEMO-001", NotificationType.PAYMENT_SUCCESS, "Payment Successful", "Payment of ₹1008.00 for order ORD-DEMO-001 was successful.", true);
        createNotificationIfAbsent(notifRepo, username, "ORD-DEMO-001", NotificationType.ORDER_DELIVERED, "Order Delivered", "Order ORD-DEMO-001 has been delivered. Enjoy your groceries!", true);
        createNotificationIfAbsent(notifRepo, username, "ORD-DEMO-002", NotificationType.ORDER_CONFIRMED, "Order Confirmed", "Your order ORD-DEMO-002 is confirmed and being packed.", false);
        createNotificationIfAbsent(notifRepo, username, "ORD-DEMO-002", NotificationType.OUT_FOR_DELIVERY, "Out for Delivery", "Order ORD-DEMO-002 is out for delivery with our courier partner.", false);
        createNotificationIfAbsent(notifRepo, username, "ORD-DEMO-003", NotificationType.ORDER_CANCELLED, "Order Cancelled", "Your order ORD-DEMO-003 has been cancelled as requested.", false);
        createNotificationIfAbsent(notifRepo, username, null, NotificationType.SUPPORT_REPLY, "Support Reply Received", "Support Team replied: 'We have updated our stock for Premium Basmati Rice!'", false);
        createNotificationIfAbsent(notifRepo, username, "ORD-DEMO-005", NotificationType.RETURN_APPROVED, "Return Request Approved", "Your return request for ORD-DEMO-005 has been approved.", false);
    }

    private void createNotificationIfAbsent(NotificationRepository notifRepo, String userId, String orderNumber, NotificationType type, String title, String message, boolean isRead) {
        if (!notifRepo.existsByUserIdAndOrderNumberAndType(userId, orderNumber, type)) {
            Notification n = new Notification(userId, type, title, message, orderNumber);
            n.setRead(isRead);
            notifRepo.save(n);
        }
    }

    @Transactional
    public void seedSupportConversations(SupportConversationRepository convRepo, SupportMessageRepository msgRepo, User user, UserRepository userRepo, ProductRepository productRepo) {
        User admin = userRepo.findByUsername("demo.admin").orElseThrow();
        List<SupportConversation> existing = convRepo.findByUserOrderByUpdatedAtDesc(user, Pageable.unpaged()).getContent();

        // Conversation 1: Product Availability
        boolean conv1Exists = existing.stream().anyMatch(c -> "Product Availability Inquiry".equals(c.getSubject()));
        if (!conv1Exists) {
            Product p = productRepo.findByExternalId("EXT-101").orElse(null);
            SupportConversation c1 = new SupportConversation(user, "Product Availability Inquiry", RequestType.PRODUCT_AVAILABILITY, p);
            c1.setStatus(ConversationStatus.RESOLVED);
            convRepo.save(c1);

            SupportMessage m1 = new SupportMessage(c1, SenderType.CUSTOMER, user, "Can you arrange 10 packets of Premium Basmati Rice?");
            msgRepo.save(m1);

            SupportMessage m2 = new SupportMessage(
                    c1,
                    SenderType.ADMIN,
                    admin,
                    "Hello! We have arranged additional stock with our supplier. They will be available in 2 days.",
                    AvailabilityStatus.AVAILABLE_LATER,
                    ZonedDateTime.now().plusDays(2)
            );
            msgRepo.save(m2);
        }

        // Conversation 2: Bulk Order
        boolean conv2Exists = existing.stream().anyMatch(c -> "Bulk Order Request for Event".equals(c.getSubject()));
        if (!conv2Exists) {
            Product p = productRepo.findByExternalId("EXT-101").orElse(null);
            SupportConversation c2 = new SupportConversation(user, "Bulk Order Request for Event", RequestType.BULK_ORDER, p);
            c2.setStatus(ConversationStatus.OPEN);
            convRepo.save(c2);

            SupportMessage m1 = new SupportMessage(c2, SenderType.CUSTOMER, user, "I need 20 packs for an event.");
            msgRepo.save(m1);

            SupportMessage m2 = new SupportMessage(c2, SenderType.ADMIN, admin, "Yes, absolutely! We can fulfill bulk orders up to 50 packs with 24 hours advance notice.");
            msgRepo.save(m2);
        }

        // Conversation 3: Delivery Question
        boolean conv3Exists = existing.stream().anyMatch(c -> "Delivery Tracking Assistance".equals(c.getSubject()));
        if (!conv3Exists) {
            SupportConversation c3 = new SupportConversation(user, "Delivery Tracking Assistance", RequestType.DELIVERY_QUESTION, null);
            c3.setStatus(ConversationStatus.OPEN);
            convRepo.save(c3);

            SupportMessage m1 = new SupportMessage(c3, SenderType.CUSTOMER, user, "When can I expect my order?");
            msgRepo.save(m1);

            SupportMessage m2 = new SupportMessage(c3, SenderType.ADMIN, admin, "Your order ORD-DEMO-002 is out for delivery and will reach you within 45 minutes.");
            msgRepo.save(m2);
        }
    }

    @Transactional
    public void seedReturnsAndCancellations(ReturnRequestRepository returnRepo, CancellationRequestRepository cancelRepo, User user, OrderRepository orderRepo) {
        String username = user.getUsername();

        // 1. Completed/Approved Cancellation for ORD-DEMO-003
        Optional<CancellationRequest> cr1Opt = cancelRepo.findByOrderNumberOrderByCreatedAtDesc("ORD-DEMO-003").stream().findFirst();
        if (cr1Opt.isEmpty()) {
            CancellationRequest cr = new CancellationRequest();
            cr.setOrderNumber("ORD-DEMO-003");
            cr.setUserId(username);
            cr.setReason(CancellationReason.CHANGED_MIND);
            cr.setNotes("Customer decided to change the order items");
            cr.setStatus(RequestStatus.APPROVED);
            cr.setRefundStatus(RefundStatus.COMPLETED);
            cr.setRefundAmount(new BigDecimal("220.50"));
            cr.setReviewedBy("demo.admin");
            cr.setReviewedAt(ZonedDateTime.now().minusDays(2));
            cr.setAdminNotes("Order cancelled before dispatch. Refund processed to original payment method.");
            cancelRepo.save(cr);
        } else {
            CancellationRequest cr = cr1Opt.get();
            if (!username.equals(cr.getUserId())) {
                cr.setUserId(username);
                cancelRepo.save(cr);
            }
        }

        // 2. Pending Cancellation for ORD-DEMO-002
        Optional<CancellationRequest> cr2Opt = cancelRepo.findByOrderNumberOrderByCreatedAtDesc("ORD-DEMO-002").stream().findFirst();
        if (cr2Opt.isEmpty()) {
            CancellationRequest cr2 = new CancellationRequest();
            cr2.setOrderNumber("ORD-DEMO-002");
            cr2.setUserId(username);
            cr2.setReason(CancellationReason.ORDERED_BY_MISTAKE);
            cr2.setNotes("Requested cancellation due to duplicate order placement");
            cr2.setStatus(RequestStatus.PENDING);
            cr2.setRefundStatus(RefundStatus.REQUESTED);
            cr2.setRefundAmount(new BigDecimal("1018.50"));
            cancelRepo.save(cr2);
        } else {
            CancellationRequest cr2 = cr2Opt.get();
            if (!username.equals(cr2.getUserId())) {
                cr2.setUserId(username);
                cancelRepo.save(cr2);
            }
        }

        // 3. Approved/Completed Return for ORD-DEMO-005
        Optional<ReturnRequest> rr1Opt = returnRepo.findByOrderNumberOrderByCreatedAtDesc("ORD-DEMO-005").stream().findFirst();
        if (rr1Opt.isEmpty()) {
            ReturnRequest rr1 = new ReturnRequest();
            rr1.setOrderNumber("ORD-DEMO-005");
            rr1.setUserId(username);
            rr1.setReason(ReturnReason.DAMAGED_INCORRECT_ITEM);
            rr1.setNotes("Received wrong variant of liquid detergent");
            rr1.setStatus(RequestStatus.APPROVED);
            rr1.setRefundStatus(RefundStatus.COMPLETED);
            rr1.setRefundAmount(new BigDecimal("390.00"));
            rr1.setReviewedBy("demo.admin");
            rr1.setReviewedAt(ZonedDateTime.now().minusDays(1));
            rr1.setAdminNotes("Return approved. Pickup completed and refund processed.");
            returnRepo.save(rr1);
        } else {
            ReturnRequest rr1 = rr1Opt.get();
            if (!username.equals(rr1.getUserId())) {
                rr1.setUserId(username);
                returnRepo.save(rr1);
            }
        }

        // 4. Pending Return with Refund-Request status for ORD-DEMO-001
        Optional<ReturnRequest> rr2Opt = returnRepo.findByOrderNumberOrderByCreatedAtDesc("ORD-DEMO-001").stream().findFirst();
        if (rr2Opt.isEmpty()) {
            ReturnRequest rr2 = new ReturnRequest();
            rr2.setOrderNumber("ORD-DEMO-001");
            rr2.setUserId(username);
            rr2.setReason(ReturnReason.PRODUCT_ISSUE);
            rr2.setNotes("Outer packaging of sugar was torn during transit");
            rr2.setStatus(RequestStatus.PENDING);
            rr2.setRefundStatus(RefundStatus.REQUESTED);
            rr2.setRefundAmount(new BigDecimal("50.00"));
            returnRepo.save(rr2);
        } else {
            ReturnRequest rr2 = rr2Opt.get();
            if (!username.equals(rr2.getUserId())) {
                rr2.setUserId(username);
                returnRepo.save(rr2);
            }
        }
    }

    @Transactional
    public void seedInventoryHistory(InventoryTransactionRepository invRepo, ProductRepository productRepo) {
        // ADMIN_ADD
        productRepo.findByExternalId("EXT-101").ifPresent(p -> {
            if (invRepo.searchTransactions(p.getId(), TransactionType.ADMIN_ADD, null, Pageable.unpaged()).isEmpty()) {
                createInventoryTx(invRepo, p.getId(), 50, 40, 90, TransactionType.ADMIN_ADD, "Stock replenishment from warehouse", null, "demo.admin");
            }
        });

        // ADMIN_SUBTRACT
        productRepo.findByExternalId("EXT-102").ifPresent(p -> {
            if (invRepo.searchTransactions(p.getId(), TransactionType.ADMIN_SUBTRACT, null, Pageable.unpaged()).isEmpty()) {
                createInventoryTx(invRepo, p.getId(), -10, 110, 100, TransactionType.ADMIN_SUBTRACT, "Damaged packaging write-off", null, "demo.admin");
            }
        });

        // ADMIN_SET
        productRepo.findByExternalId("EXT-115").ifPresent(p -> {
            if (invRepo.searchTransactions(p.getId(), TransactionType.ADMIN_SET, null, Pageable.unpaged()).isEmpty()) {
                createInventoryTx(invRepo, p.getId(), 100, 200, 300, TransactionType.ADMIN_SET, "Physical audit stock correction", null, "demo.admin");
            }
        });

        // ORDER_RESERVATION
        productRepo.findByExternalId("EXT-109").ifPresent(p -> {
            if (invRepo.searchTransactions(p.getId(), TransactionType.ORDER_RESERVATION, null, Pageable.unpaged()).isEmpty()) {
                createInventoryTx(invRepo, p.getId(), -2, 62, 60, TransactionType.ORDER_RESERVATION, "Order reservation", "ORD-DEMO-002", "system");
            }
        });

        // RESERVATION_RELEASE
        productRepo.findByExternalId("EXT-105").ifPresent(p -> {
            if (invRepo.searchTransactions(p.getId(), TransactionType.RESERVATION_RELEASE, null, Pageable.unpaged()).isEmpty()) {
                createInventoryTx(invRepo, p.getId(), 2, 148, 150, TransactionType.RESERVATION_RELEASE, "Order cancellation release", "ORD-DEMO-003", "system");
            }
        });

        // RESERVATION_COMMIT
        productRepo.findByExternalId("EXT-101").ifPresent(p -> {
            if (invRepo.searchTransactions(p.getId(), TransactionType.RESERVATION_COMMIT, null, Pageable.unpaged()).isEmpty()) {
                createInventoryTx(invRepo, p.getId(), -2, 92, 90, TransactionType.RESERVATION_COMMIT, "Order delivery commit", "ORD-DEMO-001", "system");
            }
        });
    }

    private void createInventoryTx(InventoryTransactionRepository repo, Long productId, int change, int prev, int resulting, TransactionType type, String reason, String orderNumber, String actor) {
        InventoryTransaction tx = new InventoryTransaction();
        tx.setProductId(productId);
        tx.setQuantityChange(change);
        tx.setPreviousStock(prev);
        tx.setResultingStock(resulting);
        tx.setTransactionType(type);
        tx.setReason(reason);
        tx.setOrderNumber(orderNumber);
        tx.setActorUsername(actor);
        repo.save(tx);
    }

    @Transactional
    public void seedDeliveryClusters(DeliveryClusterRepository clusterRepo, DeliveryClusterItemRepository itemRepo, DeliveryRepository deliveryRepo) {
        // Cluster 1: BLR-NORTH
        if (clusterRepo.findByClusterCode("CLUSTER-BLR-NORTH").isEmpty()) {
            DeliveryCluster dc1 = new DeliveryCluster();
            dc1.setClusterCode("CLUSTER-BLR-NORTH");
            dc1.setStatus("READY");
            dc1.setEstimatedDistance(14.5);
            dc1.setEstimatedDuration(Duration.ofMinutes(35));
            dc1.setEstimatedCost(120.00);
            dc1.setEstimatedRevenue(350.00);
            dc1.setEstimatedProfit(230.00);
            dc1.setScheduledAt(ZonedDateTime.now().plusHours(2));
            clusterRepo.save(dc1);

            deliveryRepo.findByOrderNumber("ORD-DEMO-001").ifPresent(d -> {
                if (!itemRepo.existsByDeliveryId(d.getId())) {
                    DeliveryClusterItem item = new DeliveryClusterItem();
                    item.setCluster(dc1);
                    item.setDelivery(d);
                    item.setSequenceNumber(1);
                    itemRepo.save(item);
                }
            });

            deliveryRepo.findByOrderNumber("ORD-DEMO-002").ifPresent(d -> {
                if (!itemRepo.existsByDeliveryId(d.getId())) {
                    DeliveryClusterItem item = new DeliveryClusterItem();
                    item.setCluster(dc1);
                    item.setDelivery(d);
                    item.setSequenceNumber(2);
                    itemRepo.save(item);
                }
            });
        }

        // Cluster 2: BLR-SOUTH
        if (clusterRepo.findByClusterCode("CLUSTER-BLR-SOUTH").isEmpty()) {
            DeliveryCluster dc2 = new DeliveryCluster();
            dc2.setClusterCode("CLUSTER-BLR-SOUTH");
            dc2.setStatus("DRAFT");
            dc2.setEstimatedDistance(22.0);
            dc2.setEstimatedDuration(Duration.ofMinutes(50));
            dc2.setEstimatedCost(180.00);
            dc2.setEstimatedRevenue(450.00);
            dc2.setEstimatedProfit(270.00);
            dc2.setScheduledAt(ZonedDateTime.now().plusHours(4));
            clusterRepo.save(dc2);

            deliveryRepo.findByOrderNumber("ORD-DEMO-005").ifPresent(d -> {
                if (!itemRepo.existsByDeliveryId(d.getId())) {
                    DeliveryClusterItem item = new DeliveryClusterItem();
                    item.setCluster(dc2);
                    item.setDelivery(d);
                    item.setSequenceNumber(1);
                    itemRepo.save(item);
                }
            });
        }
    }
}

