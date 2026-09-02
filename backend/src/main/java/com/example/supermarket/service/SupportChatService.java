package com.example.supermarket.service;

import com.example.supermarket.dto.*;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.repository.SupportConversationRepository;
import com.example.supermarket.repository.SupportMessageRepository;
import com.example.supermarket.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SupportChatService {

    private final SupportConversationRepository conversationRepository;
    private final SupportMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;

    public SupportChatService(
            SupportConversationRepository conversationRepository,
            SupportMessageRepository messageRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            NotificationService notificationService
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.notificationService = notificationService;
    }

    // ==================== Customer Operations ====================

    @Transactional
    public SupportConversationDetailDto createConversation(String username, CreateConversationRequest request) {
        if (request.subject() == null || request.subject().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject is required");
        }
        if (request.message() == null || request.message().trim().isEmpty()) {
            throw new IllegalArgumentException("Message is required");
        }
        if (request.requestType() == null) {
            throw new IllegalArgumentException("Request type is required");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Product product = null;
        if (request.productId() != null) {
            product = productRepository.findById(request.productId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + request.productId()));
        }

        SupportConversation conversation = new SupportConversation(
                user,
                request.subject().trim(),
                request.requestType(),
                product
        );
        conversation = conversationRepository.save(conversation);

        SupportMessage message = new SupportMessage(
                conversation,
                SenderType.CUSTOMER,
                user,
                request.message().trim()
        );
        conversation.addMessage(message);
        conversation = conversationRepository.save(conversation);

        return toDetailDto(conversation);
    }

    @Transactional(readOnly = true)
    public Page<SupportConversationDto> getCustomerConversations(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return conversationRepository.findByUserOrderByUpdatedAtDesc(user, pageable)
                .map(this::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public SupportConversationDetailDto getCustomerConversationDetails(Long conversationId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        SupportConversation conversation = conversationRepository.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found or access denied"));

        return toDetailDto(conversation);
    }

    @Transactional
    public SupportMessageDto sendCustomerMessage(Long conversationId, String username, SendMessageRequest request) {
        if (request.message() == null || request.message().trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        SupportConversation conversation = conversationRepository.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found or access denied"));

        if (conversation.getStatus() == ConversationStatus.CLOSED || conversation.getStatus() == ConversationStatus.RESOLVED) {
            conversation.setStatus(ConversationStatus.IN_PROGRESS);
        } else if (conversation.getStatus() == ConversationStatus.WAITING_FOR_CUSTOMER) {
            conversation.setStatus(ConversationStatus.IN_PROGRESS);
        }

        SupportMessage message = new SupportMessage(
                conversation,
                SenderType.CUSTOMER,
                user,
                request.message().trim()
        );
        conversation.addMessage(message);
        conversation.setUpdatedAt(ZonedDateTime.now());
        conversationRepository.save(conversation);

        return toMessageDto(message);
    }

    @Transactional
    public void markConversationAsRead(Long conversationId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        conversationRepository.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found or access denied"));
    }

    // ==================== Admin Operations ====================

    @Transactional(readOnly = true)
    public Page<SupportConversationDto> getAdminConversations(
            ConversationStatus status,
            RequestType requestType,
            String search,
            Pageable pageable
    ) {
        String querySearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return conversationRepository.findAdminConversations(status, requestType, querySearch, pageable)
                .map(this::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public SupportConversationDetailDto getAdminConversationDetails(Long conversationId) {
        SupportConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        return toDetailDto(conversation);
    }

    @Transactional
    public SupportMessageDto sendAdminReply(Long conversationId, String adminUsername, AdminReplyRequest request) {
        if (request.message() == null || request.message().trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        SupportConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        User adminUser = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new UsernameNotFoundException("Admin user not found: " + adminUsername));

        SupportMessage message = new SupportMessage(
                conversation,
                SenderType.ADMIN,
                adminUser,
                request.message().trim(),
                request.availabilityStatus(),
                request.availableAt()
        );
        conversation.addMessage(message);

        if (request.newStatus() != null) {
            conversation.setStatus(request.newStatus());
        } else if (conversation.getStatus() == ConversationStatus.OPEN || conversation.getStatus() == ConversationStatus.IN_PROGRESS) {
            conversation.setStatus(ConversationStatus.WAITING_FOR_CUSTOMER);
        }

        conversation.setUpdatedAt(ZonedDateTime.now());
        conversationRepository.save(conversation);

        // Notify customer
        String notifMsg = request.message().trim();
        if (notifMsg.length() > 100) {
            notifMsg = notifMsg.substring(0, 97) + "...";
        }
        if (request.availabilityStatus() != null && request.availabilityStatus() != AvailabilityStatus.NOT_APPLICABLE) {
            notifMsg = "[" + request.availabilityStatus() + "] " + notifMsg;
        }

        notificationService.createNotification(
                conversation.getUser().getUsername(),
                NotificationType.SUPPORT_REPLY,
                "New reply from KareMart Support",
                notifMsg,
                null
        );

        return toMessageDto(message);
    }

    @Transactional
    public SupportConversationDetailDto updateConversationStatus(Long conversationId, UpdateStatusRequest request, String adminUsername) {
        if (request.status() == null) {
            throw new IllegalArgumentException("Status cannot be null");
        }

        SupportConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        ConversationStatus oldStatus = conversation.getStatus();
        if (oldStatus != request.status()) {
            conversation.setStatus(request.status());
            conversation.setUpdatedAt(ZonedDateTime.now());
            conversationRepository.save(conversation);

            // Notify customer of status change
            notificationService.createNotification(
                    conversation.getUser().getUsername(),
                    NotificationType.SUPPORT_STATUS_UPDATE,
                    "Support Request Status Updated",
                    "Your request '" + conversation.getSubject() + "' status changed to " + request.status(),
                    null
            );
        }

        return toDetailDto(conversation);
    }

    // ==================== Helper Mappers ====================

    private SupportConversationDto toSummaryDto(SupportConversation c) {
        List<SupportMessage> msgs = c.getMessages();
        SupportMessageDto lastMsg = (msgs != null && !msgs.isEmpty()) ? toMessageDto(msgs.get(msgs.size() - 1)) : null;
        int count = (msgs != null) ? msgs.size() : 0;

        return new SupportConversationDto(
                c.getId(),
                c.getUser().getId(),
                c.getUser().getUsername(),
                c.getSubject(),
                c.getRequestType(),
                c.getProduct() != null ? c.getProduct().getId() : null,
                c.getProduct() != null ? c.getProduct().getName() : null,
                c.getProduct() != null ? c.getProduct().getImageUrl() : null,
                c.getStatus(),
                c.getCreatedAt(),
                c.getUpdatedAt(),
                count,
                lastMsg
        );
    }

    private SupportConversationDetailDto toDetailDto(SupportConversation c) {
        List<SupportMessageDto> messageDtos = c.getMessages().stream()
                .map(this::toMessageDto)
                .collect(Collectors.toList());

        return new SupportConversationDetailDto(
                c.getId(),
                c.getUser().getId(),
                c.getUser().getUsername(),
                c.getSubject(),
                c.getRequestType(),
                c.getProduct() != null ? c.getProduct().getId() : null,
                c.getProduct() != null ? c.getProduct().getName() : null,
                c.getProduct() != null ? c.getProduct().getImageUrl() : null,
                c.getStatus(),
                c.getCreatedAt(),
                c.getUpdatedAt(),
                messageDtos
        );
    }

    private SupportMessageDto toMessageDto(SupportMessage m) {
        return new SupportMessageDto(
                m.getId(),
                m.getConversation().getId(),
                m.getSenderType(),
                m.getSenderUser() != null ? m.getSenderUser().getUsername() : "KareMart Support",
                m.getMessage(),
                m.getAvailabilityStatus(),
                m.getAvailableAt(),
                m.getCreatedAt()
        );
    }
}
