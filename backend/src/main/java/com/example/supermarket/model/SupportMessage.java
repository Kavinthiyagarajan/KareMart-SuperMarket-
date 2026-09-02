package com.example.supermarket.model;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "support_messages")
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private SupportConversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false)
    private SenderType senderType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_user_id")
    private User senderUser;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status")
    private AvailabilityStatus availabilityStatus;

    @Column(name = "available_at")
    private ZonedDateTime availableAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    public SupportMessage() {}

    public SupportMessage(SupportConversation conversation, SenderType senderType, User senderUser, String message) {
        this.conversation = conversation;
        this.senderType = senderType;
        this.senderUser = senderUser;
        this.message = message;
        this.createdAt = ZonedDateTime.now();
    }

    public SupportMessage(SupportConversation conversation, SenderType senderType, User senderUser, String message, AvailabilityStatus availabilityStatus, ZonedDateTime availableAt) {
        this.conversation = conversation;
        this.senderType = senderType;
        this.senderUser = senderUser;
        this.message = message;
        this.availabilityStatus = availabilityStatus;
        this.availableAt = availableAt;
        this.createdAt = ZonedDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = ZonedDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SupportConversation getConversation() { return conversation; }
    public void setConversation(SupportConversation conversation) { this.conversation = conversation; }

    public SenderType getSenderType() { return senderType; }
    public void setSenderType(SenderType senderType) { this.senderType = senderType; }

    public User getSenderUser() { return senderUser; }
    public void setSenderUser(User senderUser) { this.senderUser = senderUser; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public AvailabilityStatus getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(AvailabilityStatus availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    public ZonedDateTime getAvailableAt() { return availableAt; }
    public void setAvailableAt(ZonedDateTime availableAt) { this.availableAt = availableAt; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
