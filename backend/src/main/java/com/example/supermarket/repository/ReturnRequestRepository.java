package com.example.supermarket.repository;

import com.example.supermarket.model.ReturnRequest;
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
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    Page<ReturnRequest> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<ReturnRequest> findByOrderNumberOrderByCreatedAtDesc(String orderNumber);

    Optional<ReturnRequest> findTopByOrderNumberOrderByCreatedAtDesc(String orderNumber);

    @Query("SELECT COUNT(r) > 0 FROM ReturnRequest r WHERE r.orderNumber = :orderNumber AND r.status IN (:statuses)")
    boolean existsByOrderNumberAndStatusIn(@Param("orderNumber") String orderNumber, @Param("statuses") List<RequestStatus> statuses);

    Page<ReturnRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ReturnRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status, Pageable pageable);

    @Query("SELECT r FROM ReturnRequest r WHERE LOWER(r.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.userId) LIKE LOWER(CONCAT('%', :search, '%')) ORDER BY r.createdAt DESC")
    Page<ReturnRequest> findBySearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT r FROM ReturnRequest r WHERE r.status = :status AND (LOWER(r.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.userId) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY r.createdAt DESC")
    Page<ReturnRequest> findByStatusAndSearch(@Param("status") RequestStatus status, @Param("search") String search, Pageable pageable);

    default Page<ReturnRequest> searchAdminReturns(RequestStatus status, String search, Pageable pageable) {
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

    @Query("SELECT r FROM ReturnRequest r WHERE r.userId = :userId ORDER BY r.createdAt DESC")
    List<ReturnRequest> findRefundableReturnsByUserId(@Param("userId") String userId);
}
