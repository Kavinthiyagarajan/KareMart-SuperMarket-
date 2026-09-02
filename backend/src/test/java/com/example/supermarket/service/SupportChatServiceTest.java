package com.example.supermarket.service;

import com.example.supermarket.dto.*;
import com.example.supermarket.model.*;
import com.example.supermarket.repository.ProductRepository;
import com.example.supermarket.repository.SupportConversationRepository;
import com.example.supermarket.repository.SupportMessageRepository;
import com.example.supermarket.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SupportChatServiceTest {

    @Mock
    private SupportConversationRepository conversationRepository;

    @Mock
    private SupportMessageRepository messageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private SupportChatService supportChatService;

    private User customer;
    private User otherCustomer;
    private User admin;
    private Product product;
    private SupportConversation conversation;

    @BeforeEach
    void setUp() {
        customer = new User("customer1", "password", Role.CUSTOMER);
        customer.setId(1L);

        otherCustomer = new User("customer2", "password", Role.CUSTOMER);
        otherCustomer.setId(2L);

        admin = new User("admin1", "password", Role.ADMIN);
        admin.setId(99L);

        product = new Product();
        product.setId(10L);
        product.setName("Basmati Rice 5kg");

        conversation = new SupportConversation(customer, "Need extra stock", RequestType.PRODUCT_AVAILABILITY, product);
        conversation.setId(100L);
        SupportMessage initialMsg = new SupportMessage(conversation, SenderType.CUSTOMER, customer, "Can you arrange 10 packets?");
        initialMsg.setId(500L);
        conversation.setMessages(new ArrayList<>(List.of(initialMsg)));
    }

    // 1. Customer creates conversation
    @Test
    void testCreateConversation_Success() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(customer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(conversationRepository.save(any(SupportConversation.class))).thenAnswer(invocation -> {
            SupportConversation c = invocation.getArgument(0);
            if (c.getId() == null) c.setId(101L);
            return c;
        });

        CreateConversationRequest request = new CreateConversationRequest(
                "Need bulk items",
                RequestType.BULK_ORDER,
                10L,
                "Please deliver by Friday"
        );

        SupportConversationDetailDto result = supportChatService.createConversation("customer1", request);
        assertNotNull(result);
        assertEquals("Need bulk items", result.subject());
        assertEquals(RequestType.BULK_ORDER, result.requestType());
        assertEquals(10L, result.productId());
        assertEquals(ConversationStatus.OPEN, result.status());
        assertEquals(1, result.messages().size());
        assertEquals("Please deliver by Friday", result.messages().get(0).message());
        verify(conversationRepository, atLeastOnce()).save(any(SupportConversation.class));
    }

    // 2. Customer retrieves only own conversations
    @Test
    void testGetCustomerConversations_RetrievesOnlyOwn() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(customer));
        Page<SupportConversation> page = new PageImpl<>(List.of(conversation));
        when(conversationRepository.findByUserOrderByUpdatedAtDesc(eq(customer), any(Pageable.class))).thenReturn(page);

        Page<SupportConversationDto> result = supportChatService.getCustomerConversations("customer1", PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
        assertEquals("Need extra stock", result.getContent().get(0).subject());
        assertEquals("customer1", result.getContent().get(0).username());
    }

    // 3. Customer cannot access another user's conversation
    @Test
    void testGetCustomerConversationDetails_AccessDeniedForOtherUser() {
        when(userRepository.findByUsername("customer2")).thenReturn(Optional.of(otherCustomer));
        when(conversationRepository.findByIdAndUser(100L, otherCustomer)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            supportChatService.getCustomerConversationDetails(100L, "customer2");
        });
    }

    // 4. Customer sends message
    @Test
    void testSendCustomerMessage_Success() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(customer));
        when(conversationRepository.findByIdAndUser(100L, customer)).thenReturn(Optional.of(conversation));
        when(conversationRepository.save(any(SupportConversation.class))).thenReturn(conversation);

        SendMessageRequest req = new SendMessageRequest("Any updates on this?");
        SupportMessageDto msg = supportChatService.sendCustomerMessage(100L, "customer1", req);

        assertNotNull(msg);
        assertEquals(SenderType.CUSTOMER, msg.senderType());
        assertEquals("Any updates on this?", msg.message());
        assertEquals(2, conversation.getMessages().size());
    }

    // 5. Admin can retrieve conversations
    @Test
    void testGetAdminConversations() {
        Page<SupportConversation> page = new PageImpl<>(List.of(conversation));
        when(conversationRepository.findAdminConversations(eq(ConversationStatus.OPEN), eq(RequestType.PRODUCT_AVAILABILITY), eq("stock"), any(Pageable.class)))
                .thenReturn(page);

        Page<SupportConversationDto> result = supportChatService.getAdminConversations(ConversationStatus.OPEN, RequestType.PRODUCT_AVAILABILITY, "stock", PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
        assertEquals("Need extra stock", result.getContent().get(0).subject());
    }

    // 7, 8, 9, 10. Admin replies with availability status, expected date, and sends customer notification
    @Test
    void testSendAdminReply_WithAvailabilityAndNotification() {
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation));
        when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
        when(conversationRepository.save(any(SupportConversation.class))).thenReturn(conversation);

        ZonedDateTime expectedDate = ZonedDateTime.now().plusDays(2);
        AdminReplyRequest replyReq = new AdminReplyRequest(
                "We can arrange 10 packets by Thursday evening.",
                AvailabilityStatus.AVAILABLE_LATER,
                expectedDate,
                ConversationStatus.WAITING_FOR_CUSTOMER
        );

        SupportMessageDto replyDto = supportChatService.sendAdminReply(100L, "admin1", replyReq);
        assertNotNull(replyDto);
        assertEquals(SenderType.ADMIN, replyDto.senderType());
        assertEquals(AvailabilityStatus.AVAILABLE_LATER, replyDto.availabilityStatus());
        assertEquals(expectedDate, replyDto.availableAt());
        assertEquals(ConversationStatus.WAITING_FOR_CUSTOMER, conversation.getStatus());

        // Verify customer notification
        verify(notificationService, times(1)).createNotification(
                eq("customer1"),
                eq(NotificationType.SUPPORT_REPLY),
                eq("New reply from KareMart Support"),
                contains("AVAILABLE_LATER"),
                isNull()
        );
    }

    // 11. Conversation status changes correctly
    @Test
    void testUpdateConversationStatus() {
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(conversation));
        when(conversationRepository.save(any(SupportConversation.class))).thenReturn(conversation);

        UpdateStatusRequest req = new UpdateStatusRequest(ConversationStatus.RESOLVED);
        SupportConversationDetailDto updated = supportChatService.updateConversationStatus(100L, req, "admin1");

        assertEquals(ConversationStatus.RESOLVED, updated.status());
        verify(notificationService, times(1)).createNotification(
                eq("customer1"),
                eq(NotificationType.SUPPORT_STATUS_UPDATE),
                eq("Support Request Status Updated"),
                contains("RESOLVED"),
                isNull()
        );
    }

    // 12. Validation handles invalid / empty inputs
    @Test
    void testCreateConversation_Validation() {
        CreateConversationRequest emptySubject = new CreateConversationRequest("", RequestType.OTHER, null, "Hello");
        assertThrows(IllegalArgumentException.class, () -> supportChatService.createConversation("customer1", emptySubject));

        CreateConversationRequest emptyMsg = new CreateConversationRequest("Subj", RequestType.OTHER, null, "  ");
        assertThrows(IllegalArgumentException.class, () -> supportChatService.createConversation("customer1", emptyMsg));
    }

    // 13. Product-linked request validates product exists
    @Test
    void testCreateConversation_InvalidProduct() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(customer));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        CreateConversationRequest req = new CreateConversationRequest("Stock", RequestType.PRODUCT_AVAILABILITY, 999L, "Need info");
        assertThrows(IllegalArgumentException.class, () -> supportChatService.createConversation("customer1", req));
    }

    // 14. Pagination works
    @Test
    void testPagination() {
        when(userRepository.findByUsername("customer1")).thenReturn(Optional.of(customer));
        Page<SupportConversation> emptyPage = new PageImpl<>(List.of(), PageRequest.of(5, 10), 0);
        when(conversationRepository.findByUserOrderByUpdatedAtDesc(eq(customer), eq(PageRequest.of(5, 10)))).thenReturn(emptyPage);

        Page<SupportConversationDto> res = supportChatService.getCustomerConversations("customer1", PageRequest.of(5, 10));
        assertEquals(0, res.getTotalElements());
        assertEquals(5, res.getNumber());
    }
}
