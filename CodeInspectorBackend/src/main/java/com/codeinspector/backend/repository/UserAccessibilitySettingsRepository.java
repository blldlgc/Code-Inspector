package com.codeinspector.backend.repository;

import com.codeinspector.backend.model.User;
import com.codeinspector.backend.model.UserAccessibilitySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAccessibilitySettingsRepository extends JpaRepository<UserAccessibilitySettings, Long> {
    Optional<UserAccessibilitySettings> findByUser(User user);
    Optional<UserAccessibilitySettings> findByUser_Id(Long userId);
}


