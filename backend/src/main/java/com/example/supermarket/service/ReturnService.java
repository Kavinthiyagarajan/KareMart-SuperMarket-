package com.example.supermarket.service;

import com.example.supermarket.dto.ReturnRequestDto;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import com.example.supermarket.repository.ReturnRequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ReturnService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final NotificationService notificationService;

    public ReturnService(OrderRepository orderRepository,
                         PaymentRepository paymentRepository,
                         ReturnRequestRepository returnRequestRepository,
                         NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.returnRequestRepository = returnRequestRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ReturnRequestDto requestReturn(String orderNumber, ReturnReason reason, String notes, String customerId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderNumber));

        if (!order.getCustomerId().equals(customerId)) {
            throw new SecurityException("Unauthorized access to order " + orderNumber);
        }

        if (!"DELIVERED".equals(order.getStatus())) {
            throw new IllegalStateException("Only delivered orders are eligible for return. Current status: " + order.getStatus());
        }

        // Verify payment
        Payment payment = paymentRepository.findByOrderNumber(orderNumber).orElse(null);
        if (payment == null || payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new IllegalStateException("Cannot request return for unpaid order.");
        }

        // Check for existing active return request
        boolean hasActiveReturn = returnRequestRepository.existsByOrderNumberAndStatusIn(
                orderNumber,
                List.of(RequestStatus.PENDING, RequestStatus.APPROVED)
        );

        if (hasActiveReturn) {
            throw new IllegalStateException("An active return request already exists for order " + orderNumber);
        }

        ReturnRequest request = new ReturnRequest();
        request.setOrderNumber(orderNumber);
        request.setUserId(customerId);
        request.setReason(reason != null ? reason : ReturnReason.OTHER);
        request.setNotes(notes);
        request.setStatus(RequestStatus.PENDING);
        request.setRefundStatus(RefundStatus.REQUESTED);
        request.setRefundAmount(order.getTotal());
        request = returnRequestRepository.save(request);

        // Notify customer
        notificationService.createNotification(
                customerId,
                NotificationType.RETURN_REQUESTED,
                "Return Request Received",
                "Your return request for order " + orderNumber + " has been received and is pending review.",
                orderNumber
        );

        notificationService.createNotification(
                customerId,
                NotificationType.REFUND_REQUESTED,
                "Refund Requested",
                "A refund request of ₹" + order.getTotal() + " has been submitted for order " + orderNumber + ".",
                orderNumber
        );

        return ReturnRequestDto.fromEntity(request);
    }

    @Transactional(readOnly = true)
    public Page<ReturnRequestDto> getReturnsForCustomer(String customerId, Pageable pageable) {
        return returnRequestRepository.findByUserIdOrderByCreatedAtDesc(customerId, pageable)
                .map(ReturnRequestDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public Optional<ReturnRequestDto> getReturnForOrder(String orderNumber, String customerId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderNumber));

        if (!order.getCustomerId().equals(customerId)) {
            throw new SecurityException("Unauthorized access to order " + orderNumber);
        }

        return returnRequestRepository.findTopByOrderNumberOrderByCreatedAtDesc(orderNumber)
                .map(ReturnRequestDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public Optional<ReturnRequestDto> getReturnById(Long id, String customerId) {
        return returnRequestRepository.findById(id)
                .filter(r -> r.getUserId().equals(customerId))
                .map(ReturnRequestDto::fromEntity);
    }
}
