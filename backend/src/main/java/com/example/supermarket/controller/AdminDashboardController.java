package com.example.supermarket.controller;

import com.example.supermarket.dto.AdminDashboardSummaryDto;
import com.example.supermarket.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminDashboardSummaryDto> getDashboardSummary() {
        AdminDashboardSummaryDto summary = adminDashboardService.getDashboardSummary();
        return ResponseEntity.ok(summary);
    }
}
