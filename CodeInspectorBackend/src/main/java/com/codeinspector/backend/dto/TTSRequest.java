package com.codeinspector.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TTSRequest {
    private String text;
    private String language; // "tr-TR" for Turkish
    private Double speed; // 0.5 to 2.0
}


