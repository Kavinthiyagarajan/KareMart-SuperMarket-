package com.example.supermarket.repository;

import com.example.supermarket.model.Address;
import com.example.supermarket.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserOrderByIsDefaultDescCreatedAtDesc(User user);
    Optional<Address> findByIdAndUser(Long id, User user);
    List<Address> findByUserAndIsDefaultTrue(User user);
}
