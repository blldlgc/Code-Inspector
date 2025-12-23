package com.codeinspector.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TTSResponse {
    private String audioBase64; // Base64 encoded audio data
    private String contentType; // "audio/mpeg" or "audio/wav"
    private Integer duration; // Duration in milliseconds
}


