package com.codeinspector.backend.service;

import com.codeinspector.backend.dto.AccessibilitySettingsDTO;
import com.codeinspector.backend.model.User;
import com.codeinspector.backend.model.UserAccessibilitySettings;
import com.codeinspector.backend.repository.UserAccessibilitySettingsRepository;
import com.codeinspector.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccessibilityService {

    private final UserAccessibilitySettingsRepository settingsRepository;
    private final UserRepository userRepository;

    /**
     * Mevcut kullanıcının erişilebilirlik ayarlarını getirir
     */
    public AccessibilitySettingsDTO getSettings(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Optional<UserAccessibilitySettings> settingsOpt = settingsRepository.findByUser(user);
        
        if (settingsOpt.isPresent()) {
            return convertToDTO(settingsOpt.get());
        } else {
            // Varsayılan ayarlarla yeni bir kayıt oluştur
            UserAccessibilitySettings defaultSettings = new UserAccessibilitySettings();
            defaultSettings.setUser(user);
            defaultSettings.setFontSize("medium");
            defaultSettings.setFontFamily("default");
            defaultSettings.setHighContrast(false);
            defaultSettings.setColorBlindnessTheme("none");
            defaultSettings.setVoiceReadingEnabled(false);
            defaultSettings.setVoiceReadingSpeed(1.0);
            defaultSettings.setCreatedAt(LocalDateTime.now());
            defaultSettings.setUpdatedAt(LocalDateTime.now());
            defaultSettings = settingsRepository.save(defaultSettings);
            return convertToDTO(defaultSettings);
        }
    }

    /**
     * Mevcut kullanıcının erişilebilirlik ayarlarını günceller
     */
    @Transactional
    public AccessibilitySettingsDTO updateSettings(Long userId, AccessibilitySettingsDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Optional<UserAccessibilitySettings> settingsOpt = settingsRepository.findByUser(user);
        
        UserAccessibilitySettings settings;
        boolean isNew = false;
        if (settingsOpt.isPresent()) {
            settings = settingsOpt.get();
        } else {
            settings = new UserAccessibilitySettings();
            settings.setUser(user);
            settings.setCreatedAt(LocalDateTime.now());
            isNew = true;
        }

        // Ayarları güncelle
        if (dto.getFontSize() != null) {
            settings.setFontSize(dto.getFontSize());
        }
        if (dto.getFontFamily() != null) {
            settings.setFontFamily(dto.getFontFamily());
        }
        if (dto.getHighContrast() != null) {
            settings.setHighContrast(dto.getHighContrast());
        }
        if (dto.getColorBlindnessTheme() != null) {
            settings.setColorBlindnessTheme(dto.getColorBlindnessTheme());
        }
        if (dto.getVoiceReadingEnabled() != null) {
            settings.setVoiceReadingEnabled(dto.getVoiceReadingEnabled());
        }
        if (dto.getVoiceReadingSpeed() != null) {
            // Hız kontrolü
            double speed = dto.getVoiceReadingSpeed();
            if (speed < 0.5) speed = 0.5;
            if (speed > 2.0) speed = 2.0;
            settings.setVoiceReadingSpeed(speed);
        }

        // Varsayılan değerleri set et (eğer null ise)
        if (settings.getFontSize() == null) {
            settings.setFontSize("medium");
        }
        if (settings.getFontFamily() == null) {
            settings.setFontFamily("default");
        }
        if (settings.getHighContrast() == null) {
            settings.setHighContrast(false);
        }
        if (settings.getColorBlindnessTheme() == null) {
            settings.setColorBlindnessTheme("none");
        }
        if (settings.getVoiceReadingEnabled() == null) {
            settings.setVoiceReadingEnabled(false);
        }
        if (settings.getVoiceReadingSpeed() == null) {
            settings.setVoiceReadingSpeed(1.0);
        }
        if (isNew && settings.getCreatedAt() == null) {
            settings.setCreatedAt(LocalDateTime.now());
        }
        settings.setUpdatedAt(LocalDateTime.now());

        settings = settingsRepository.save(settings);
        log.info("Updated accessibility settings for user: {}", userId);
        
        return convertToDTO(settings);
    }

    /**
     * SecurityContext'ten mevcut kullanıcıyı alır
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }
        
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));
    }

    private AccessibilitySettingsDTO convertToDTO(UserAccessibilitySettings settings) {
        return AccessibilitySettingsDTO.builder()
                .fontSize(settings.getFontSize() != null ? settings.getFontSize() : "medium")
                .fontFamily(settings.getFontFamily() != null ? settings.getFontFamily() : "default")
                .highContrast(settings.getHighContrast() != null ? settings.getHighContrast() : false)
                .colorBlindnessTheme(settings.getColorBlindnessTheme() != null ? settings.getColorBlindnessTheme() : "none")
                .voiceReadingEnabled(settings.getVoiceReadingEnabled() != null ? settings.getVoiceReadingEnabled() : false)
                .voiceReadingSpeed(settings.getVoiceReadingSpeed() != null ? settings.getVoiceReadingSpeed() : 1.0)
                .build();
    }
}

