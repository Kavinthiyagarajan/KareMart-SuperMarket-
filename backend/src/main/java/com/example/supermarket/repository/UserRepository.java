package com.example.supermarket.repository;

import com.example.supermarket.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    long countByRole(com.example.supermarket.model.Role role);
}
