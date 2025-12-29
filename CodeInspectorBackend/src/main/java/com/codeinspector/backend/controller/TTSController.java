package com.codeinspector.backend.controller;

import com.codeinspector.backend.dto.TTSRequest;
import com.codeinspector.backend.dto.TTSResponse;
import com.codeinspector.backend.service.TextToSpeechService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tts")
@RequiredArgsConstructor
public class TTSController {

    private final TextToSpeechService ttsService;

    @PostMapping("/speak")
    public ResponseEntity<TTSResponse> speak(@RequestBody TTSRequest request) {
        // #region agent log
        try {
            java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
            fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_tts_controller\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TTSController.java:18\",\"message\":\"TTS speak endpoint called\",\"data\":{\"textLength\":" + (request.getText() != null ? request.getText().length() : 0) + ",\"language\":\"" + request.getLanguage() + "\",\"speed\":" + request.getSpeed() + "},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"C\"}\n");
            fw.close();
        } catch (Exception e) {}
        // #endregion
        try {
            TTSResponse response = ttsService.convertToSpeech(request);
            // #region agent log
            try {
                java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
                fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_tts_success\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TTSController.java:25\",\"message\":\"TTS response created\",\"data\":{\"contentType\":\"" + response.getContentType() + "\",\"hasAudioBase64\":" + (response.getAudioBase64() != null) + "},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"C\"}\n");
                fw.close();
            } catch (Exception e) {}
            // #endregion
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // #region agent log
            try {
                java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
                fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_tts_illegal_arg\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TTSController.java:30\",\"message\":\"TTS IllegalArgumentException\",\"data\":{\"message\":\"" + e.getMessage() + "\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"C\"}\n");
                fw.close();
            } catch (Exception ex) {}
            // #endregion
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            // #region agent log
            try {
                java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
                fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_tts_exception\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TTSController.java:35\",\"message\":\"TTS Exception\",\"data\":{\"message\":\"" + e.getMessage() + "\",\"class\":\"" + e.getClass().getName() + "\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"C\"}\n");
                fw.close();
            } catch (Exception ex) {}
            // #endregion
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}


