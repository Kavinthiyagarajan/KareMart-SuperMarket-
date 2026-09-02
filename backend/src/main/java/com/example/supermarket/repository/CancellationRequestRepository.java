package com.example.supermarket.repository;

import com.example.supermarket.model.CancellationRequest;
import com.example.supermarket.model.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CancellationRequestRepository extends JpaRepository<CancellationRequest, Long> {

    Page<CancellationRequest> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<CancellationRequest> findByOrderNumberOrderByCreatedAtDesc(String orderNumber);

    Optional<CancellationRequest> findTopByOrderNumberOrderByCreatedAtDesc(String orderNumber);

    boolean existsByOrderNumberAndStatus(String orderNumber, RequestStatus status);

    Page<CancellationRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<CancellationRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status, Pageable pageable);

    @Query("SELECT c FROM CancellationRequest c WHERE LOWER(c.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.userId) LIKE LOWER(CONCAT('%', :search, '%')) ORDER BY c.createdAt DESC")
    Page<CancellationRequest> findBySearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM CancellationRequest c WHERE c.status = :status AND (LOWER(c.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.userId) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY c.createdAt DESC")
    Page<CancellationRequest> findByStatusAndSearch(@Param("status") RequestStatus status, @Param("search") String search, Pageable pageable);

    default Page<CancellationRequest> searchAdminCancellations(RequestStatus status, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        if (status != null && cleanSearch != null) {
            return findByStatusAndSearch(status, cleanSearch, pageable);
        } else if (status != null) {
            return findByStatusOrderByCreatedAtDesc(status, pageable);
        } else if (cleanSearch != null) {
            return findBySearch(cleanSearch, pageable);
        } else {
            return findAllByOrderByCreatedAtDesc(pageable);
        }
    }

    @Query("SELECT c FROM CancellationRequest c WHERE c.userId = :userId AND c.refundStatus != 'NOT_REQUESTED' ORDER BY c.createdAt DESC")
    List<CancellationRequest> findRefundableCancellationsByUserId(@Param("userId") String userId);
}
