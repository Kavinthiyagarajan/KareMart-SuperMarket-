package com.example.supermarket.repository;

import com.example.supermarket.model.SupportConversation;
import com.example.supermarket.model.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    List<SupportMessage> findByConversationOrderByCreatedAtAsc(SupportConversation conversation);

    List<SupportMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    long countByConversation(SupportConversation conversation);
}
