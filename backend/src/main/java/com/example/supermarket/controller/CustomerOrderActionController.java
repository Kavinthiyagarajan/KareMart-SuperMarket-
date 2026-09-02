package com.example.supermarket.controller;

import com.example.supermarket.dto.*;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.CancellationRequestRepository;
import com.example.supermarket.repository.OrderRepository;
import com.example.supermarket.repository.PaymentRepository;
import com.example.supermarket.repository.ReturnRequestRepository;
import com.example.supermarket.service.CancellationService;
import com.example.supermarket.service.ReturnService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/profile")
public class CustomerOrderActionController {

    private final CancellationService cancellationService;
    private final ReturnService returnService;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final ReturnRequestRepository returnRequestRepository;

    public CustomerOrderActionController(CancellationService cancellationService,
                                         ReturnService returnService,
                                         OrderRepository orderRepository,
                                         PaymentRepository paymentRepository,
                                         CancellationRequestRepository cancellationRequestRepository,
                                         ReturnRequestRepository returnRequestRepository) {
        this.cancellationService = cancellationService;
        this.returnService = returnService;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.cancellationRequestRepository = cancellationRequestRepository;
        this.returnRequestRepository = returnRequestRepository;
    }

    @PostMapping("/orders/{orderNumber}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable("orderNumber") String orderNumber,
            @RequestBody(required = false) CancelOrderRequest request,
            Principal principal) {

        if (principal == null) return ResponseEntity.status(401).build();

        try {
            CancellationReason reason = request != null && request.reason() != null ? request.reason() : CancellationReason.OTHER;
            String notes = request != null ? request.notes() : null;

            CancellationRequestDto dto = cancellationService.cancelOrder(orderNumber, reason, notes, principal.getName());
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/orders/{orderNumber}/return")
    public ResponseEntity<?> requestReturn(
            @PathVariable("orderNumber") String orderNumber,
            @RequestBody(required = false) ReturnOrderRequest request,
            Principal principal) {

        if (principal == null) return ResponseEntity.status(401).build();

        try {
            ReturnReason reason = request != null && request.reason() != null ? request.reason() : ReturnReason.OTHER;
            String notes = request != null ? request.notes() : null;

            ReturnRequestDto dto = returnService.requestReturn(orderNumber, reason, notes, principal.getName());
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/orders/{orderNumber}/actions")
    public ResponseEntity<?> getOrderActionEligibility(
            @PathVariable("orderNumber") String orderNumber,
            Principal principal) {

        if (principal == null) return ResponseEntity.status(401).build();

        Order order = orderRepository.findByOrderNumber(orderNumber).orElse(null);
        if (order == null || !order.getCustomerId().equals(principal.getName())) {
            return ResponseEntity.status(403).build();
        }

        Optional<CancellationRequest> latestCancel = cancellationRequestRepository.findTopByOrderNumberOrderByCreatedAtDesc(orderNumber);
        Optional<ReturnRequest> latestReturn = returnRequestRepository.findTopByOrderNumberOrderByCreatedAtDesc(orderNumber);

        boolean hasActiveCancel = latestCancel.isPresent() &&
                (latestCancel.get().getStatus() == RequestStatus.PENDING || latestCancel.get().getStatus() == RequestStatus.APPROVED);
        boolean hasActiveReturn = latestReturn.isPresent() &&
                (latestReturn.get().getStatus() == RequestStatus.PENDING || latestReturn.get().getStatus() == RequestStatus.APPROVED);

        boolean canCancel = ("PENDING_PAYMENT".equals(order.getStatus()) || "CONFIRMED".equals(order.getStatus())) &&
                !"CANCELLED".equals(order.getStatus()) && !"DELIVERED".equals(order.getStatus());

        String cancelIneligibleReason = null;
        if (!canCancel) {
            if ("DELIVERED".equals(order.getStatus())) {
                cancelIneligibleReason = "Delivered orders cannot be cancelled. You can request a return instead.";
            } else if ("CANCELLED".equals(order.getStatus())) {
                cancelIneligibleReason = "Order is already cancelled.";
            } else {
                cancelIneligibleReason = "Cannot cancel order in status: " + order.getStatus();
            }
        }

        Payment payment = paymentRepository.findByOrderNumber(orderNumber).orElse(null);
        boolean isPaid = payment != null && payment.getStatus() == PaymentStatus.SUCCESS;

        boolean canRequestReturn = "DELIVERED".equals(order.getStatus()) && isPaid && !hasActiveReturn;

        String returnIneligibleReason = null;
        if (!canRequestReturn) {
            if (!"DELIVERED".equals(order.getStatus())) {
                returnIneligibleReason = "Returns can only be requested after the order has been delivered.";
            } else if (!isPaid) {
                returnIneligibleReason = "Unpaid orders are not eligible for return.";
            } else if (hasActiveReturn) {
                returnIneligibleReason = "An active return request is already in progress for this order.";
            }
        }

        OrderActionEligibilityDto dto = new OrderActionEligibilityDto(
                canCancel,
                canRequestReturn,
                hasActiveCancel,
                hasActiveReturn,
                cancelIneligibleReason,
                returnIneligibleReason,
                latestCancel.map(CancellationRequestDto::fromEntity).orElse(null),
                latestReturn.map(ReturnRequestDto::fromEntity).orElse(null)
        );

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/returns")
    public ResponseEntity<Page<ReturnRequestDto>> getMyReturns(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {

        if (principal == null) return ResponseEntity.status(401).build();
        if (size > 50) size = 50;

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(returnService.getReturnsForCustomer(principal.getName(), pageable));
    }

    @GetMapping("/returns/{id}")
    public ResponseEntity<ReturnRequestDto> getReturnDetails(@PathVariable("id") Long id, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();

        return returnService.getReturnById(id, principal.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cancellations")
    public ResponseEntity<Page<CancellationRequestDto>> getMyCancellations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {

        if (principal == null) return ResponseEntity.status(401).build();
        if (size > 50) size = 50;

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(cancellationService.getCancellationsForCustomer(principal.getName(), pageable));
    }

    @GetMapping("/refunds")
    public ResponseEntity<List<CustomerRefundDto>> getMyRefunds(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();

        String userId = principal.getName();
        List<CustomerRefundDto> refunds = new ArrayList<>();

        List<CancellationRequest> cancellations = cancellationRequestRepository.findRefundableCancellationsByUserId(userId);
        for (CancellationRequest c : cancellations) {
            refunds.add(new CustomerRefundDto(
                    "CANCELLATION",
                    c.getId(),
                    c.getOrderNumber(),
                    c.getRefundAmount() != null ? c.getRefundAmount() : java.math.BigDecimal.ZERO,
                    c.getRefundStatus(),
                    c.getReason().name(),
                    c.getNotes(),
                    c.getCreatedAt(),
                    c.getUpdatedAt(),
                    c.getAdminNotes()
            ));
        }

        List<ReturnRequest> returns = returnRequestRepository.findRefundableReturnsByUserId(userId);
        for (ReturnRequest r : returns) {
            refunds.add(new CustomerRefundDto(
                    "RETURN",
                    r.getId(),
                    r.getOrderNumber(),
                    r.getRefundAmount(),
                    r.getRefundStatus(),
                    r.getReason().name(),
                    r.getNotes(),
                    r.getCreatedAt(),
                    r.getUpdatedAt(),
                    r.getAdminNotes()
            ));
        }

        // Sort descending by requestedAt
        refunds.sort((a, b) -> b.requestedAt().compareTo(a.requestedAt()));

        return ResponseEntity.ok(refunds);
    }

    private record ErrorResponse(String message) {}
}
