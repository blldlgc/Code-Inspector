package com.codeinspector.backend.repository;

import com.codeinspector.backend.model.User;
import com.codeinspector.backend.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    long countByEnabled(boolean enabled);
    long countByRole(UserRole role);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}