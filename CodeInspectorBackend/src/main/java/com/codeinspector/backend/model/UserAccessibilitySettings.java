package com.codeinspector.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_accessibility_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAccessibilitySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true)
    @JsonIgnore
    private User user;

    @Column(name = "font_size", length = 20)
    private String fontSize; // small, medium, large, xlarge

    @Column(name = "font_family", length = 50)
    private String fontFamily; // default, sans-serif, serif, monospace

    @Column(name = "high_contrast")
    private Boolean highContrast;

    @Column(name = "color_blindness_theme", length = 20)
    private String colorBlindnessTheme; // none, deuteranopia, protanopia, tritanopia

    @Column(name = "voice_reading_enabled")
    private Boolean voiceReadingEnabled;

    @Column(name = "voice_reading_speed")
    private Double voiceReadingSpeed; // 0.5 to 2.0

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

