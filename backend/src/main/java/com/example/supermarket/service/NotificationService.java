package com.example.supermarket.service;

import com.example.supermarket.dto.NotificationDto;
import com.example.supermarket.model.Notification;
import com.example.supermarket.model.NotificationType;
import com.example.supermarket.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void createNotification(String userId, NotificationType type, String title, String message, String orderNumber) {
        // Idempotency check for specific events (avoid duplicates for same order state)
        if (orderNumber != null) {
            boolean exists = notificationRepository.existsByUserIdAndOrderNumberAndType(userId, orderNumber, type);
            if (exists) {
                return;
            }
        }
        
        Notification notification = new Notification(userId, type, title, message, orderNumber);
        notificationRepository.save(notification);
    }

    public Page<NotificationDto> getUserNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
            .map(n -> new NotificationDto(
                n.getId(), n.getType().name(), n.getTitle(), n.getMessage(), 
                n.isRead(), n.getOrderNumber(), n.getCreatedAt()
            ));
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long id, String userId) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized");
        }
        
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsRead(userId);
    }
}
