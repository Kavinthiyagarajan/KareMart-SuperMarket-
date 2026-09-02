package com.example.supermarket.controller;

import com.example.supermarket.dto.AdminCompleteReturnRequest;
import com.example.supermarket.dto.AdminReviewRequest;
import com.example.supermarket.dto.CancellationRequestDto;
import com.example.supermarket.dto.ReturnRequestDto;
import com.example.supermarket.model.RequestStatus;
import com.example.supermarket.service.AdminReturnCancellationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminReturnsController {

    private final AdminReturnCancellationService adminReturnCancellationService;

    public AdminReturnsController(AdminReturnCancellationService adminReturnCancellationService) {
        this.adminReturnCancellationService = adminReturnCancellationService;
    }

    @GetMapping("/returns")
    public ResponseEntity<Page<ReturnRequestDto>> getReturns(
            @RequestParam(name = "status", required = false) String statusStr,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {

        if (size > 50) size = 50;
        Pageable pageable = PageRequest.of(page, size);

        RequestStatus status = null;
        if (statusStr != null && !statusStr.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                status = RequestStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        return ResponseEntity.ok(adminReturnCancellationService.searchReturns(status, search, pageable));
    }

    @GetMapping("/cancellations")
    public ResponseEntity<Page<CancellationRequestDto>> getCancellations(
            @RequestParam(name = "status", required = false) String statusStr,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {

        if (size > 50) size = 50;
        Pageable pageable = PageRequest.of(page, size);

        RequestStatus status = null;
        if (statusStr != null && !statusStr.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                status = RequestStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        return ResponseEntity.ok(adminReturnCancellationService.searchCancellations(status, search, pageable));
    }

    @PostMapping("/cancellations/{id}/review")
    public ResponseEntity<?> reviewCancellation(
            @PathVariable("id") Long id,
            @RequestBody AdminReviewRequest request,
            Principal principal) {

        String adminUsername = principal != null ? principal.getName() : "ADMIN";
        try {
            CancellationRequestDto dto = adminReturnCancellationService.reviewCancellation(
                    id,
                    request.approve(),
                    request.adminNotes(),
                    adminUsername
            );
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/returns/{id}/review")
    public ResponseEntity<?> reviewReturn(
            @PathVariable("id") Long id,
            @RequestBody AdminReviewRequest request,
            Principal principal) {

        String adminUsername = principal != null ? principal.getName() : "ADMIN";
        try {
            ReturnRequestDto dto = adminReturnCancellationService.reviewReturn(
                    id,
                    request.approve(),
                    request.adminNotes(),
                    adminUsername
            );
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/returns/{id}/complete")
    public ResponseEntity<?> completeReturn(
            @PathVariable("id") Long id,
            @RequestBody(required = false) AdminCompleteReturnRequest request,
            Principal principal) {

        String adminUsername = principal != null ? principal.getName() : "ADMIN";
        boolean restock = request != null && request.restockItems();
        String notes = request != null ? request.adminNotes() : null;

        try {
            ReturnRequestDto dto = adminReturnCancellationService.completeReturn(
                    id,
                    restock,
                    notes,
                    adminUsername
            );
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    private record ErrorResponse(String message) {}
}
