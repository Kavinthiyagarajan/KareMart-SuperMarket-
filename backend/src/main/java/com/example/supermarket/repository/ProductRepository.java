package com.example.supermarket.repository;

import com.example.supermarket.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByExternalId(String externalId);
    Optional<Product> findBySlug(String slug);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Product p SET p.availableQuantity = p.availableQuantity + :quantity, p.availabilityStatus = CASE WHEN (p.availableQuantity + :quantity) > 0 THEN 'IN_STOCK' ELSE p.availabilityStatus END WHERE p.id = :productId")
    void incrementStock(@Param("productId") Long productId, @Param("quantity") Integer quantity);

    @Query("SELECT p FROM Product p LEFT JOIN p.category c " +
           "WHERE p.active = true " +
           "AND (:query = '' OR " +
           "      LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "      OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "      OR LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:category = '' OR c.slug = :category OR c.name = :category) " +
           "AND (:minPrice IS NULL OR p.sellingPrice >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.sellingPrice <= :maxPrice) " +
           "AND (:availabilityStatus = '' OR p.availabilityStatus = :availabilityStatus)")
    Page<Product> searchProducts(@Param("query") String query, 
                                 @Param("category") String category,
                                 @Param("minPrice") java.math.BigDecimal minPrice,
                                 @Param("maxPrice") java.math.BigDecimal maxPrice,
                                 @Param("availabilityStatus") String availabilityStatus,
                                 Pageable pageable);

    Page<Product> findByActiveTrue(Pageable pageable);

    @Query("SELECT p FROM Product p LEFT JOIN p.category c " +
           "WHERE p.active = true AND p.discountPercent > 0 " +
           "AND (:category = '' OR c.slug = :category OR c.name = :category) " +
           "AND (:minPrice IS NULL OR p.sellingPrice >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.sellingPrice <= :maxPrice) " +
           "AND (:availabilityStatus = '' OR p.availabilityStatus = :availabilityStatus)")
    Page<Product> findDeals(@Param("category") String category,
                            @Param("minPrice") java.math.BigDecimal minPrice,
                            @Param("maxPrice") java.math.BigDecimal maxPrice,
                            @Param("availabilityStatus") String availabilityStatus,
                            Pageable pageable);

    long countByActiveTrue();
    
    long countByActiveTrueAndAvailableQuantityLessThanEqual(Integer quantity);
    
    java.util.List<Product> findTop5ByActiveTrueAndAvailableQuantityLessThanEqualOrderByAvailableQuantityAsc(Integer quantity);

    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.id != :excludeProductId AND p.active = true")
    java.util.List<Product> findRelatedProducts(@Param("categoryId") Long categoryId, @Param("excludeProductId") Long excludeProductId, Pageable pageable);

    java.util.List<Product> findByIdIn(java.util.List<Long> ids);
}
