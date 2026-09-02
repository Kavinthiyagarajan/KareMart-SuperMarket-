package com.example.supermarket.controller;

import com.example.supermarket.dto.*;
import com.example.supermarket.service.SupportChatService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/support/conversations")
public class SupportController {

    private final SupportChatService supportChatService;

    public SupportController(SupportChatService supportChatService) {
        this.supportChatService = supportChatService;
    }

    @PostMapping
    public ResponseEntity<SupportConversationDetailDto> createConversation(
            @RequestBody CreateConversationRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(supportChatService.createConversation(principal.getName(), request));
    }

    @GetMapping
    public ResponseEntity<Page<SupportConversationDto>> getCustomerConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal
    ) {
        return ResponseEntity.ok(supportChatService.getCustomerConversations(
                principal.getName(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"))
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupportConversationDetailDto> getCustomerConversationDetails(
            @PathVariable Long id,
            Principal principal
    ) {
        return ResponseEntity.ok(supportChatService.getCustomerConversationDetails(id, principal.getName()));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<SupportMessageDto> sendCustomerMessage(
            @PathVariable Long id,
            @RequestBody SendMessageRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(supportChatService.sendCustomerMessage(id, principal.getName(), request));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markConversationAsRead(
            @PathVariable Long id,
            Principal principal
    ) {
        supportChatService.markConversationAsRead(id, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Conversation marked as read"));
    }
}
