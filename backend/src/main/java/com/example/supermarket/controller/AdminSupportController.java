package com.example.supermarket.controller;

import com.example.supermarket.dto.*;
import com.example.supermarket.model.ConversationStatus;
import com.example.supermarket.model.RequestType;
import com.example.supermarket.service.SupportChatService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/admin/support/conversations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSupportController {

    private final SupportChatService supportChatService;

    public AdminSupportController(SupportChatService supportChatService) {
        this.supportChatService = supportChatService;
    }

    @GetMapping
    public ResponseEntity<Page<SupportConversationDto>> getAdminConversations(
            @RequestParam(required = false) ConversationStatus status,
            @RequestParam(required = false) RequestType requestType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(supportChatService.getAdminConversations(
                status,
                requestType,
                search,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"))
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupportConversationDetailDto> getAdminConversationDetails(@PathVariable Long id) {
        return ResponseEntity.ok(supportChatService.getAdminConversationDetails(id));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<SupportMessageDto> sendAdminReply(
            @PathVariable Long id,
            @RequestBody AdminReplyRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(supportChatService.sendAdminReply(id, principal.getName(), request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<SupportConversationDetailDto> updateConversationStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(supportChatService.updateConversationStatus(id, request, principal.getName()));
    }
}
