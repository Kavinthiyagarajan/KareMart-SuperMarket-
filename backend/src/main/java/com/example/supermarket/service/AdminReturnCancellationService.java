package com.example.supermarket.service;

import com.example.supermarket.dto.CancellationRequestDto;
import com.example.supermarket.dto.ReturnRequestDto;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;

@Service
public class AdminReturnCancellationService {

    private final CancellationRequestRepository cancellationRequestRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryReservationService inventoryReservationService;
    private final DeliveryService deliveryService;
    private final InventoryAuditService inventoryAuditService;
    private final NotificationService notificationService;

    public AdminReturnCancellationService(CancellationRequestRepository cancellationRequestRepository,
                                          ReturnRequestRepository returnRequestRepository,
                                          OrderRepository orderRepository,
                                          ProductRepository productRepository,
                                          InventoryReservationService inventoryReservationService,
                                          DeliveryService deliveryService,
                                          InventoryAuditService inventoryAuditService,
                                          NotificationService notificationService) {
        this.cancellationRequestRepository = cancellationRequestRepository;
        this.returnRequestRepository = returnRequestRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.inventoryReservationService = inventoryReservationService;
        this.deliveryService = deliveryService;
        this.inventoryAuditService = inventoryAuditService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public Page<CancellationRequestDto> searchCancellations(RequestStatus status, String search, Pageable pageable) {
        return cancellationRequestRepository.searchAdminCancellations(status, search, pageable)
                .map(CancellationRequestDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ReturnRequestDto> searchReturns(RequestStatus status, String search, Pageable pageable) {
        return returnRequestRepository.searchAdminReturns(status, search, pageable)
                .map(ReturnRequestDto::fromEntity);
    }

    @Transactional
    public CancellationRequestDto reviewCancellation(Long id, boolean approve, String adminNotes, String adminUsername) {
        CancellationRequest request = cancellationRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cancellation request not found: " + id));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Only pending cancellation requests can be reviewed. Current status: " + request.getStatus());
        }

        request.setReviewedBy(adminUsername);
        request.setReviewedAt(ZonedDateTime.now());
        request.setAdminNotes(adminNotes);

        if (approve) {
            request.setStatus(RequestStatus.APPROVED);
            if (request.getRefundStatus() == RefundStatus.REQUESTED) {
                request.setRefundStatus(RefundStatus.APPROVED);
            }

            Order order = orderRepository.findByOrderNumber(request.getOrderNumber()).orElse(null);
            if (order != null && !"CANCELLED".equals(order.getStatus())) {
                order.setStatus("CANCELLED");
                orderRepository.save(order);
                inventoryReservationService.releaseReservations(order.getOrderNumber(), ReservationStatus.RELEASED);
                try {
                    deliveryService.cancelDelivery(order.getOrderNumber());
                } catch (Exception ignored) {}
            }

            notificationService.createNotification(
                    request.getUserId(),
                    NotificationType.CANCELLATION_APPROVED,
                    "Cancellation Approved",
                    "Your cancellation request for order " + request.getOrderNumber() + " has been approved.",
                    request.getOrderNumber()
            );

            if (request.getRefundStatus() == RefundStatus.APPROVED) {
                notificationService.createNotification(
                        request.getUserId(),
                        NotificationType.REFUND_APPROVED,
                        "Refund Approved",
                        "Your refund for order " + request.getOrderNumber() + " has been approved.",
                        request.getOrderNumber()
                );
            }
        } else {
            request.setStatus(RequestStatus.REJECTED);
            if (request.getRefundStatus() == RefundStatus.REQUESTED) {
                request.setRefundStatus(RefundStatus.REJECTED);
            }

            notificationService.createNotification(
                    request.getUserId(),
                    NotificationType.CANCELLATION_REJECTED,
                    "Cancellation Request Declined",
                    "Your cancellation request for order " + request.getOrderNumber() + " was declined: " + (adminNotes != null ? adminNotes : "Order could not be cancelled."),
                    request.getOrderNumber()
            );
        }

        request = cancellationRequestRepository.save(request);
        return CancellationRequestDto.fromEntity(request);
    }

    @Transactional
    public ReturnRequestDto reviewReturn(Long id, boolean approve, String adminNotes, String adminUsername) {
        ReturnRequest request = returnRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Return request not found: " + id));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Only pending return requests can be reviewed. Current status: " + request.getStatus());
        }

        request.setReviewedBy(adminUsername);
        request.setReviewedAt(ZonedDateTime.now());
        request.setAdminNotes(adminNotes);

        if (approve) {
            request.setStatus(RequestStatus.APPROVED);
            request.setRefundStatus(RefundStatus.APPROVED);

            notificationService.createNotification(
                    request.getUserId(),
                    NotificationType.RETURN_APPROVED,
                    "Return Request Approved",
                    "Your return request for order " + request.getOrderNumber() + " has been approved.",
                    request.getOrderNumber()
            );

            notificationService.createNotification(
                    request.getUserId(),
                    NotificationType.REFUND_APPROVED,
                    "Refund Approved",
                    "Refund of ₹" + request.getRefundAmount() + " has been approved for order " + request.getOrderNumber() + ".",
                    request.getOrderNumber()
            );
        } else {
            request.setStatus(RequestStatus.REJECTED);
            request.setRefundStatus(RefundStatus.REJECTED);

            notificationService.createNotification(
                    request.getUserId(),
                    NotificationType.RETURN_REJECTED,
                    "Return Request Declined",
                    "Your return request for order " + request.getOrderNumber() + " was declined: " + (adminNotes != null ? adminNotes : "Criteria not met."),
                    request.getOrderNumber()
            );
        }

        request = returnRequestRepository.save(request);
        return ReturnRequestDto.fromEntity(request);
    }

    @Transactional
    public ReturnRequestDto completeReturn(Long id, boolean restockItems, String adminNotes, String adminUsername) {
        ReturnRequest request = returnRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Return request not found: " + id));

        if (request.getStatus() != RequestStatus.APPROVED) {
            throw new IllegalStateException("Only approved return requests can be marked as completed. Current status: " + request.getStatus());
        }

        request.setStatus(RequestStatus.COMPLETED);
        request.setRefundStatus(RefundStatus.COMPLETED);
        if (adminNotes != null && !adminNotes.trim().isEmpty()) {
            request.setAdminNotes(request.getAdminNotes() != null ? request.getAdminNotes() + " | " + adminNotes : adminNotes);
        }
        request.setReviewedBy(adminUsername);
        request.setReviewedAt(ZonedDateTime.now());

        // Perform inventory restocking if requested
        if (restockItems) {
            Order order = orderRepository.findByOrderNumber(request.getOrderNumber()).orElse(null);
            if (order != null) {
                // Sort items by productId to avoid deadlocks
                java.util.List<OrderItem> sortedItems = order.getItems().stream()
                        .sorted(java.util.Comparator.comparing(item -> item.getProduct().getId()))
                        .toList();

                for (OrderItem item : sortedItems) {
                    Product product = productRepository.findByIdForUpdate(item.getProduct().getId()).orElse(null);
                    if (product != null) {
                        int prevStock = product.getAvailableQuantity();
                        int newStock = prevStock + item.getQuantity();
                        product.setAvailableQuantity(newStock);
                        if (newStock > 0) {
                            product.setAvailabilityStatus("IN_STOCK");
                        }
                        productRepository.save(product);

                        inventoryAuditService.recordAudit(
                                product,
                                item.getQuantity(),
                                prevStock,
                                newStock,
                                TransactionType.ADMIN_ADD,
                                "Return Restock: " + order.getOrderNumber(),
                                order.getOrderNumber(),
                                adminUsername
                        );
                    }
                }
            }
        }

        request = returnRequestRepository.save(request);

        notificationService.createNotification(
                request.getUserId(),
                NotificationType.RETURN_COMPLETED,
                "Return Completed",
                "Your return for order " + request.getOrderNumber() + " has been successfully completed.",
                request.getOrderNumber()
        );

        notificationService.createNotification(
                request.getUserId(),
                NotificationType.REFUND_COMPLETED,
                "Refund Completed",
                "Your refund of ₹" + request.getRefundAmount() + " for order " + request.getOrderNumber() + " has been processed.",
                request.getOrderNumber()
        );

        return ReturnRequestDto.fromEntity(request);
    }
}
