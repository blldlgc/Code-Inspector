package com.codeinspector.backend.repository;

import com.codeinspector.backend.model.User;
import com.codeinspector.backend.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    // Soft delete için yeni metodlar
    List<User> findByDeletedAtIsNull();
    Optional<User> findByIdAndDeletedAtIsNull(Long id);
    long countByDeletedAtIsNull();
    long countByEnabledTrueAndDeletedAtIsNull();
    long countByRoleAndDeletedAtIsNull(UserRole role);
    long countByCreatedAtAfterAndDeletedAtIsNull(LocalDateTime date);
}