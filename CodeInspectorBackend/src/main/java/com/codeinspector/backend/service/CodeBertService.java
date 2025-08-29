package com.codeinspector.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.codeinspector.backend.dto.CodeBertResponse;
import java.util.Map;
import java.util.HashMap;

@Service
public class CodeBertService {
    
    @Value("${codebert.api.url}")
    private String codebertApiUrl;
    
    private final RestTemplate restTemplate;
    
    public CodeBertService() {
        this.restTemplate = new RestTemplate();
    }
    
    public CodeBertResponse compareCodes(String code1, String code2) {
        // FastAPI'ye gönderilecek request body'yi hazırla
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("a", code1);  // API'nin beklediği parametre adları "a" ve "b"
        requestBody.put("b", code2);
        
        // HTTP Headers'ı ayarla
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // HTTP Entity'yi oluştur
        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
        
        try {
            // FastAPI endpoint'ine POST isteği gönder
            ResponseEntity<CodeBertResponse> response = restTemplate.postForEntity(
                codebertApiUrl + "/similarity",  // Yeni endpoint: /similarity
                request,
                CodeBertResponse.class
            );
            
            return response.getBody();
        } catch (Exception e) {
            // Hata durumunda varsayılan bir yanıt döndür
            return new CodeBertResponse(0.0);
        }
    }
}
