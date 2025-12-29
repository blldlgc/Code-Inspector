package com.codeinspector.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessibilitySettingsDTO {
    private String fontSize; // small, medium, large, xlarge
    private String fontFamily; // default, sans-serif, serif, monospace
    private Boolean highContrast;
    private String colorBlindnessTheme; // none, deuteranopia, protanopia, tritanopia
    private Boolean voiceReadingEnabled;
    private Double voiceReadingSpeed; // 0.5 to 2.0
}


