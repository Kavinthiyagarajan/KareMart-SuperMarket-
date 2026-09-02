package com.example.supermarket.repository;

import com.example.supermarket.model.ConversationStatus;
import com.example.supermarket.model.RequestType;
import com.example.supermarket.model.SupportConversation;
import com.example.supermarket.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SupportConversationRepository extends JpaRepository<SupportConversation, Long> {

    Page<SupportConversation> findByUserOrderByUpdatedAtDesc(User user, Pageable pageable);

    Optional<SupportConversation> findByIdAndUser(Long id, User user);

    Page<SupportConversation> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    Page<SupportConversation> findByStatusOrderByUpdatedAtDesc(ConversationStatus status, Pageable pageable);

    Page<SupportConversation> findByRequestTypeOrderByUpdatedAtDesc(RequestType requestType, Pageable pageable);

    Page<SupportConversation> findByStatusAndRequestTypeOrderByUpdatedAtDesc(ConversationStatus status, RequestType requestType, Pageable pageable);

    @Query("SELECT c FROM SupportConversation c WHERE LOWER(c.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.user.username) LIKE LOWER(CONCAT('%', :search, '%')) ORDER BY c.updatedAt DESC")
    Page<SupportConversation> findBySearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM SupportConversation c WHERE c.status = :status AND (LOWER(c.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.user.username) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY c.updatedAt DESC")
    Page<SupportConversation> findByStatusAndSearch(@Param("status") ConversationStatus status, @Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM SupportConversation c WHERE c.requestType = :requestType AND (LOWER(c.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.user.username) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY c.updatedAt DESC")
    Page<SupportConversation> findByRequestTypeAndSearch(@Param("requestType") RequestType requestType, @Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM SupportConversation c WHERE c.status = :status AND c.requestType = :requestType AND (LOWER(c.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.user.username) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY c.updatedAt DESC")
    Page<SupportConversation> findByStatusAndRequestTypeAndSearch(@Param("status") ConversationStatus status, @Param("requestType") RequestType requestType, @Param("search") String search, Pageable pageable);

    default Page<SupportConversation> findAdminConversations(
            ConversationStatus status,
            RequestType requestType,
            String search,
            Pageable pageable
    ) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        if (status != null && requestType != null && cleanSearch != null) {
            return findByStatusAndRequestTypeAndSearch(status, requestType, cleanSearch, pageable);
        } else if (status != null && requestType != null) {
            return findByStatusAndRequestTypeOrderByUpdatedAtDesc(status, requestType, pageable);
        } else if (status != null && cleanSearch != null) {
            return findByStatusAndSearch(status, cleanSearch, pageable);
        } else if (requestType != null && cleanSearch != null) {
            return findByRequestTypeAndSearch(requestType, cleanSearch, pageable);
        } else if (status != null) {
            return findByStatusOrderByUpdatedAtDesc(status, pageable);
        } else if (requestType != null) {
            return findByRequestTypeOrderByUpdatedAtDesc(requestType, pageable);
        } else if (cleanSearch != null) {
            return findBySearch(cleanSearch, pageable);
        } else {
            return findAllByOrderByUpdatedAtDesc(pageable);
        }
    }

    long countByStatus(ConversationStatus status);
}
