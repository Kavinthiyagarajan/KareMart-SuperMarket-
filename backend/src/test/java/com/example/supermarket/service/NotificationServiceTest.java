package com.example.supermarket.service;

import com.example.supermarket.dto.NotificationDto;
import com.example.supermarket.model.Notification;
import com.example.supermarket.model.NotificationType;
import com.example.supermarket.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private Notification notification;

    @BeforeEach
    void setUp() {
        notification = new Notification("user1", NotificationType.ORDER_CONFIRMED, "Title", "Message", "ORD1");
        notification.setId(1L);
    }

    @Test
    void testCreateNotification() {
        when(notificationRepository.existsByUserIdAndOrderNumberAndType("user1", "ORD1", NotificationType.ORDER_CONFIRMED)).thenReturn(false);
        notificationService.createNotification("user1", NotificationType.ORDER_CONFIRMED, "Title", "Message", "ORD1");
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void testDuplicateNotification() {
        when(notificationRepository.existsByUserIdAndOrderNumberAndType("user1", "ORD1", NotificationType.ORDER_CONFIRMED)).thenReturn(true);
        notificationService.createNotification("user1", NotificationType.ORDER_CONFIRMED, "Title", "Message", "ORD1");
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void testGetUserNotifications() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq("user1"), any())).thenReturn(new PageImpl<>(List.of(notification)));
        Page<NotificationDto> result = notificationService.getUserNotifications("user1", PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
        assertEquals("Title", result.getContent().get(0).getTitle());
    }

    @Test
    void testGetUnreadCount() {
        when(notificationRepository.countByUserIdAndReadFalse("user1")).thenReturn(5L);
        assertEquals(5L, notificationService.getUnreadCount("user1"));
    }

    @Test
    void testMarkAsRead_Success() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        notificationService.markAsRead(1L, "user1");
        assertTrue(notification.isRead());
        verify(notificationRepository, times(1)).save(notification);
    }

    @Test
    void testMarkAsRead_Unauthorized() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        assertThrows(IllegalArgumentException.class, () -> notificationService.markAsRead(1L, "user2"));
    }

    @Test
    void testMarkAllAsRead() {
        notificationService.markAllAsRead("user1");
        verify(notificationRepository, times(1)).markAllAsRead("user1");
    }
}
