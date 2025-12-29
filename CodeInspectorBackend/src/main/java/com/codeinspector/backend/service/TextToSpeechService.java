package com.codeinspector.backend.service;

import com.codeinspector.backend.dto.TTSRequest;
import com.codeinspector.backend.dto.TTSResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Text-to-Speech servisi
 * Şu an için basit bir implementasyon. Gelecekte Google Cloud TTS veya başka bir TTS servisi entegre edilebilir.
 */
@Service
@Slf4j
public class TextToSpeechService {

    /**
     * Metni ses dosyasına dönüştürür
     * Not: Bu basit bir implementasyon. Gerçek TTS için Google Cloud TTS, Azure TTS veya benzeri bir servis kullanılmalı.
     * Şu an için metni base64 encoded string olarak döndürüyor (frontend'de Web Speech API kullanılabilir).
     * 
     * @param request TTS isteği
     * @return TTS yanıtı
     */
    public TTSResponse convertToSpeech(TTSRequest request) {
        try {
            String text = request.getText();
            if (text == null || text.trim().isEmpty()) {
                throw new IllegalArgumentException("Text cannot be empty");
            }

            // Translate common Turkish phrases to English for better TTS
            text = translateTurkishToEnglish(text);

            // Speed control
            double speed = request.getSpeed() != null ? request.getSpeed() : 1.0;
            if (speed < 0.5 || speed > 2.0) {
                speed = 1.0; // Default speed
            }

            // Language check
            String language = request.getLanguage() != null ? request.getLanguage() : "en-US";

            log.info("TTS request received - Text length: {}, Language: {}, Speed: {}", 
                    text.length(), language, speed);
            log.debug("TTS request text preview: {}", text.length() > 100 ? text.substring(0, 100) + "..." : text);

            // Use Google Translate TTS API (free, no API key required for basic usage)
            // Note: This is a workaround. For production, use Google Cloud TTS or Azure TTS with proper API keys
            try {
                byte[] audioData = generateAudioWithGoogleTTS(text, language, speed);
                String audioBase64 = Base64.getEncoder().encodeToString(audioData);
                
                log.info("TTS audio generated successfully - Audio size: {} bytes", audioData.length);
                
                return TTSResponse.builder()
                        .audioBase64(audioBase64)
                        .contentType("audio/mp3")
                        .duration(estimateDuration(text, speed))
                        .build();
            } catch (Exception e) {
                log.error("Failed to generate audio with TTS service: {}", e.getMessage(), e);
                // #region agent log
                try {
                    java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
                    fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_tts_final_fail\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TextToSpeechService.java:68\",\"message\":\"All TTS services failed\",\"data\":{\"error\":\"" + e.getMessage().replace("\"", "\\\"") + "\",\"errorClass\":\"" + e.getClass().getName() + "\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"I\"}\n");
                    fw.close();
                } catch (Exception ex) {}
                // #endregion
                // Fallback: return text if TTS fails
                String encodedText = Base64.getEncoder().encodeToString(
                    text.getBytes(StandardCharsets.UTF_8)
                );
                return TTSResponse.builder()
                        .audioBase64(encodedText)
                        .contentType("text/plain")
                        .duration(estimateDuration(text, speed))
                        .build();
            }

        } catch (Exception e) {
            log.error("Error converting text to speech", e);
            throw new RuntimeException("Failed to convert text to speech: " + e.getMessage(), e);
        }
    }

    /**
     * Generates audio using alternative TTS service
     * Note: For production, use Google Cloud TTS or Azure TTS with proper API keys
     */
    private byte[] generateAudioWithGoogleTTS(String text, String language, double speed) throws IOException {
        // Map language codes (en-US -> en, tr-TR -> tr, etc.)
        String langCode = language;
        if (language.contains("-")) {
            langCode = language.substring(0, language.indexOf("-"));
        }
        
        // Don't truncate here - let the sentence splitting handle it
        // This preserves more of the original text
        
        // Try multiple TTS services as fallback
        // Method 1: Try Google Translate TTS with updated URL format
        try {
            return tryGoogleTranslateTTS(text, langCode);
        } catch (Exception e1) {
            log.debug("Google Translate TTS failed: {}", e1.getMessage());
            // Method 2: Try alternative TTS service
            try {
                return tryAlternativeTTSService(text, langCode);
            } catch (Exception e2) {
                log.debug("Alternative TTS service failed: {}", e2.getMessage());
                throw new IOException("All TTS services failed. Last error: " + e2.getMessage());
            }
        }
    }
    
    private byte[] tryGoogleTranslateTTS(String text, String langCode) throws IOException {
        // Clean text more carefully - preserve readability
        // Remove only problematic characters, keep punctuation for better TTS
        // Also fix encoding issues (replace problematic characters)
        text = text.replaceAll("[{}\\[\\]]", " ") // Remove brackets but keep quotes for emphasis
                   .replaceAll("\\s+", " ") // Normalize whitespace
                   .replaceAll("[^\\x00-\\x7F]", " ") // Remove non-ASCII characters that might cause encoding issues
                   .replaceAll("Ä±", "i") // Fix common encoding issue
                   .replaceAll("Ä", "A") // Fix common encoding issue
                   .trim();
        
        // #region agent log
        try {
            java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
            fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_tts_text_clean\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TextToSpeechService.java:tryGoogleTranslateTTS\",\"message\":\"Text cleaned for TTS\",\"data\":{\"textLength\":" + text.length() + ",\"textPreview\":\"" + (text.length() > 100 ? text.substring(0, 100).replace("\"", "\\\"") : text.replace("\"", "\\\"")) + "\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"I\"}\n");
            fw.close();
        } catch (Exception ex) {}
        // #endregion
        
        // Split text into sentences for better TTS quality
        // Use more sophisticated splitting that preserves context
        String[] sentences = text.split("(?<=[.!?])\\s+");
        if (sentences.length == 0 || sentences[0].trim().isEmpty()) {
            // If no sentence breaks found, split by commas or just use the text
            sentences = text.split("(?<=,)\\s+");
            if (sentences.length == 0 || sentences[0].trim().isEmpty()) {
                sentences = new String[]{text};
            }
        }
        
        ByteArrayOutputStream combinedAudio = new ByteArrayOutputStream();
        int processedSentences = 0;
        int maxSentences = 10; // Increased limit for longer texts
        
        for (String sentence : sentences) {
            if (sentence.trim().isEmpty() || processedSentences >= maxSentences) {
                continue;
            }
            
            sentence = sentence.trim();
            // Increased sentence length limit for better context
            if (sentence.length() > 200) {
                // Split long sentences by commas
                String[] parts = sentence.split("(?<=,)\\s+");
                for (String part : parts) {
                    if (part.trim().isEmpty() || processedSentences >= maxSentences) {
                        continue;
                    }
                    String processedPart = part.trim();
                    if (processedPart.length() > 200) {
                        processedPart = processedPart.substring(0, 200);
                    }
                    // Process this part
                    if (!processSentence(processedPart, langCode, combinedAudio, processedSentences)) {
                        if (processedSentences == 0) {
                            throw new IOException("Failed to process first sentence part");
                        }
                        break; // Stop if processing fails but we have some audio
                    }
                    processedSentences++;
                    if (processedSentences >= maxSentences) {
                        break;
                    }
                    // Small delay between requests
                    try {
                        Thread.sleep(200);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new IOException("Interrupted while generating TTS", e);
                    }
                }
                continue; // Move to next sentence
            }
            
            // Process normal-length sentence
            if (!processSentence(sentence, langCode, combinedAudio, processedSentences)) {
                if (processedSentences == 0) {
                    throw new IOException("Failed to process first sentence");
                }
                break; // Stop if processing fails but we have some audio
            }
            processedSentences++;
            if (processedSentences >= maxSentences) {
                break;
            }
            
            // Small delay between requests
            try {
                Thread.sleep(200);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("Interrupted while generating TTS", e);
            }
        }
        
        if (combinedAudio.size() == 0) {
            throw new IOException("No audio data generated");
        }
        
        byte[] audioData = combinedAudio.toByteArray();
        log.debug("Generated {} bytes of audio data from {} sentences", audioData.length, processedSentences);
        return audioData;
    }
    
    private boolean processSentence(String sentence, String langCode, ByteArrayOutputStream combinedAudio, int sentenceIndex) {
        try {
            String encodedText = URLEncoder.encode(sentence, StandardCharsets.UTF_8);
            String ttsUrl = String.format(
                "https://translate.google.com/translate_tts?ie=UTF-8&tl=%s&client=gtx&q=%s",
                langCode, encodedText
            );
            
            log.debug("Trying Google Translate TTS for sentence {}: {}", sentenceIndex + 1, ttsUrl.replace(encodedText, "[TEXT]"));
            
            URL url = new URL(ttsUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
            connection.setRequestProperty("Accept", "*/*");
            connection.setRequestProperty("Accept-Language", "en-US,en;q=0.9");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(10000);
            
            int responseCode = connection.getResponseCode();
            // #region agent log
            try {
                java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
                fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_tts_http\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TextToSpeechService.java:responseCode\",\"message\":\"Google TTS HTTP response\",\"data\":{\"responseCode\":" + responseCode + ",\"sentenceLength\":" + sentence.length() + ",\"sentenceIndex\":" + sentenceIndex + "},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"I\"}\n");
                fw.close();
            } catch (Exception ex) {}
            // #endregion
            if (responseCode == 200) {
                try (InputStream inputStream = connection.getInputStream()) {
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        combinedAudio.write(buffer, 0, bytesRead);
                    }
                }
                // #region agent log
                try {
                    java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
                    fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_tts_success\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TextToSpeechService.java:success\",\"message\":\"Google TTS sentence success\",\"data\":{\"sentenceIndex\":" + sentenceIndex + ",\"audioSize\":" + combinedAudio.size() + "},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"I\"}\n");
                    fw.close();
                } catch (Exception ex) {}
                // #endregion
                connection.disconnect();
                return true;
            } else if (responseCode == 429) {
                // Rate limiting - wait a bit and retry
                log.warn("Google TTS rate limited (429), waiting before retry");
                // #region agent log
                try {
                    java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
                    fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_tts_rate_limit\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TextToSpeechService.java:rateLimit\",\"message\":\"Google TTS rate limited\",\"data\":{\"responseCode\":429},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"I\"}\n");
                    fw.close();
                } catch (Exception ex) {}
                // #endregion
                connection.disconnect();
                try {
                    Thread.sleep(1000); // Wait 1 second
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return false; // Retry this sentence
            } else {
                // #region agent log
                try {
                    java.io.InputStream errorStream = connection.getErrorStream();
                    String errorBody = "";
                    if (errorStream != null) {
                        byte[] errorBytes = new byte[1024];
                        int errorBytesRead = errorStream.read(errorBytes);
                        if (errorBytesRead > 0) {
                            errorBody = new String(errorBytes, 0, errorBytesRead, StandardCharsets.UTF_8);
                        }
                    }
                    java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
                    fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_tts_error\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TextToSpeechService.java:error\",\"message\":\"Google TTS HTTP error\",\"data\":{\"responseCode\":" + responseCode + ",\"errorBody\":\"" + errorBody.replace("\"", "\\\"") + "\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"I\"}\n");
                    fw.close();
                } catch (Exception ex) {}
                // #endregion
                log.warn("Google TTS returned HTTP {} for sentence: {}", responseCode, sentence.substring(0, Math.min(50, sentence.length())));
                connection.disconnect();
                return false;
            }
        } catch (Exception e) {
            log.warn("Error processing sentence: {}", e.getMessage());
            return false;
        }
    }
    
    private byte[] tryAlternativeTTSService(String text, String langCode) throws IOException {
        // Alternative: Try a different TTS service endpoint
        // Using a public TTS API that doesn't require authentication
        try {
            // Clean and prepare text
            text = text.replaceAll("[{}\\[\\]\"']", " ").replaceAll("\\s+", " ").trim();
            if (text.length() > 100) {
                text = text.substring(0, 100);
            }
            
            // Try using a different Google TTS endpoint format
            String encodedText = URLEncoder.encode(text, StandardCharsets.UTF_8);
            String ttsUrl = String.format(
                "https://translate.google.com/translate_tts?ie=UTF-8&tl=%s&client=tw-ob&ttsspeed=1&q=%s",
                langCode, encodedText
            );
            
            log.debug("Trying alternative Google TTS format: {}", ttsUrl.replace(encodedText, "[TEXT]"));
            
            URL url = new URL(ttsUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            connection.setRequestProperty("Accept", "audio/mpeg, audio/*, */*");
            connection.setRequestProperty("Referer", "https://translate.google.com/");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(10000);
            
            int responseCode = connection.getResponseCode();
            // #region agent log
            try {
                java.io.FileWriter fw = new java.io.FileWriter("/mnt/disk3/Projects/Code-Inspector/.cursor/debug.log", true);
                fw.write("{\"id\":\"log_" + System.currentTimeMillis() + "_alt_tts\",\"timestamp\":" + System.currentTimeMillis() + ",\"location\":\"TextToSpeechService.java:tryAlternativeTTSService\",\"message\":\"Alternative TTS response\",\"data\":{\"responseCode\":" + responseCode + "},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"L\"}\n");
                fw.close();
            } catch (Exception ex) {}
            // #endregion
            
            if (responseCode == 200) {
                try (InputStream inputStream = connection.getInputStream();
                     ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                    
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                    
                    byte[] audioData = outputStream.toByteArray();
                    log.debug("Received {} bytes of audio data from alternative TTS", audioData.length);
                    return audioData;
                }
            } else {
                throw new IOException("Alternative TTS returned HTTP " + responseCode);
            }
        } catch (Exception e) {
            log.warn("Alternative TTS service failed: {}", e.getMessage());
            throw new IOException("Alternative TTS service not available: " + e.getMessage(), e);
        }
    }

    /**
     * Translates common Turkish phrases to English for better TTS
     */
    private String translateTurkishToEnglish(String text) {
        // Common Turkish to English translations
        text = text.replaceAll("(?i)\\bAnaliz sonuçları\\b", "Analysis results");
        text = text.replaceAll("(?i)\\bAnaliz\\b", "Analysis");
        text = text.replaceAll("(?i)\\bSonuçlar\\b", "Results");
        text = text.replaceAll("(?i)\\bDosya\\b", "File");
        text = text.replaceAll("(?i)\\bDosyalar\\b", "Files");
        text = text.replaceAll("(?i)\\bKod\\b", "Code");
        text = text.replaceAll("(?i)\\bHata\\b", "Error");
        text = text.replaceAll("(?i)\\bHatalar\\b", "Errors");
        text = text.replaceAll("(?i)\\bUyarı\\b", "Warning");
        text = text.replaceAll("(?i)\\bUyarılar\\b", "Warnings");
        text = text.replaceAll("(?i)\\bBaşarılı\\b", "Successful");
        text = text.replaceAll("(?i)\\bBaşarısız\\b", "Failed");
        text = text.replaceAll("(?i)\\bToplam\\b", "Total");
        text = text.replaceAll("(?i)\\bSayı\\b", "Count");
        text = text.replaceAll("(?i)\\bYüzde\\b", "Percent");
        text = text.replaceAll("(?i)\\bDetaylar\\b", "Details");
        text = text.replaceAll("(?i)\\bDetay\\b", "Detail");
        text = text.replaceAll("(?i)\\bÖzet\\b", "Summary");
        text = text.replaceAll("(?i)\\bRapor\\b", "Report");
        text = text.replaceAll("(?i)\\bMetrik\\b", "Metric");
        text = text.replaceAll("(?i)\\bMetrikler\\b", "Metrics");
        text = text.replaceAll("(?i)\\bKapsam\\b", "Coverage");
        text = text.replaceAll("(?i)\\bTest\\b", "Test");
        text = text.replaceAll("(?i)\\bTestler\\b", "Tests");
        text = text.replaceAll("(?i)\\bGüvenlik\\b", "Security");
        text = text.replaceAll("(?i)\\bKalite\\b", "Quality");
        text = text.replaceAll("(?i)\\bSkor\\b", "Score");
        text = text.replaceAll("(?i)\\bPuan\\b", "Score");
        text = text.replaceAll("(?i)\\bYüksek\\b", "High");
        text = text.replaceAll("(?i)\\bDüşük\\b", "Low");
        text = text.replaceAll("(?i)\\bOrta\\b", "Medium");
        text = text.replaceAll("(?i)\\bİyi\\b", "Good");
        text = text.replaceAll("(?i)\\bKötü\\b", "Bad");
        text = text.replaceAll("(?i)\\bKritik\\b", "Critical");
        text = text.replaceAll("(?i)\\bÖnemli\\b", "Important");
        text = text.replaceAll("(?i)\\bBilgi\\b", "Information");
        text = text.replaceAll("(?i)\\bMesaj\\b", "Message");
        text = text.replaceAll("(?i)\\bDurum\\b", "Status");
        text = text.replaceAll("(?i)\\bTamamlandı\\b", "Completed");
        text = text.replaceAll("(?i)\\bDevam ediyor\\b", "In progress");
        text = text.replaceAll("(?i)\\bBeklemede\\b", "Pending");
        text = text.replaceAll("(?i)\\bBaşlatıldı\\b", "Started");
        text = text.replaceAll("(?i)\\bBitti\\b", "Finished");
        text = text.replaceAll("(?i)\\bBitti\\b", "Done");
        return text;
    }

    /**
     * Estimates duration based on text length (milliseconds)
     */
    private int estimateDuration(String text, double speed) {
        // Average reading speed: 150 words per minute (for English)
        // Estimate based on word count
        int wordCount = text.split("\\s+").length;
        double minutes = wordCount / 150.0;
        double seconds = minutes * 60.0;
        int milliseconds = (int) (seconds * 1000.0 / speed);
        return milliseconds;
    }
}


