package com.codeinspector.backend.utils;

import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer;
import ai.djl.ndarray.NDArray;
import ai.djl.ndarray.NDList;
import ai.djl.ndarray.NDManager;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.translate.TranslateException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CodeBERTAnalyzer {
    
    private static final String MODEL_NAME = "microsoft/codebert-base";
    private static final int MAX_LENGTH = 512;
    private ZooModel<String, NDArray> model;
    private HuggingFaceTokenizer tokenizer;
    private boolean isInitialized = false;
    
    public CodeBERTAnalyzer() {
        initializeModel();
    }
    
    private void initializeModel() {
        try {
            // Basit tokenizer ile başla (model yükleme şimdilik devre dışı)
            tokenizer = HuggingFaceTokenizer.newInstance(MODEL_NAME);
            isInitialized = true;
            System.out.println("CodeBERT tokenizer başarıyla yüklendi");
            
        } catch (Exception e) {
            System.err.println("CodeBERT tokenizer yüklenemedi, basit tokenizer kullanılacak: " + e.getMessage());
            isInitialized = true; // Basit tokenizer ile devam et
        }
    }
    
    public double calculateSemanticSimilarity(String code1, String code2) {
        if (!isInitialized) {
            return 0.0; // Tokenizer yüklenemezse 0 döndür
        }
        
        try {
            // Kodları normalize et
            String normalizedCode1 = normalizeCode(code1);
            String normalizedCode2 = normalizeCode(code2);
            
            // Basit token-based similarity hesapla (model olmadan)
            double similarity = calculateTokenBasedSimilarity(normalizedCode1, normalizedCode2);
            
            return Math.max(0.0, Math.min(100.0, similarity * 100.0));
            
        } catch (Exception e) {
            System.err.println("Semantic similarity hesaplanamadı: " + e.getMessage());
            return 0.0;
        }
    }
    
    private double calculateTokenBasedSimilarity(String code1, String code2) {
        try {
            List<String> tokens1, tokens2;
            
            // Eğer HuggingFace tokenizer yüklendiyse onu kullan, yoksa basit tokenizer
            if (tokenizer != null) {
                tokens1 = tokenizer.tokenize(code1);
                tokens2 = tokenizer.tokenize(code2);
            } else {
                // Basit tokenizer - kelime bazlı tokenization
                tokens1 = simpleTokenize(code1);
                tokens2 = simpleTokenize(code2);
            }
            
            // Convert to sets for intersection calculation
            java.util.Set<String> set1 = new java.util.HashSet<>(tokens1);
            java.util.Set<String> set2 = new java.util.HashSet<>(tokens2);
            
            // Calculate Jaccard similarity
            java.util.Set<String> intersection = new java.util.HashSet<>(set1);
            intersection.retainAll(set2);
            
            java.util.Set<String> union = new java.util.HashSet<>(set1);
            union.addAll(set2);
            
            if (union.isEmpty()) {
                return 0.0;
            }
            
            return (double) intersection.size() / union.size();
            
        } catch (Exception e) {
            System.err.println("Token-based similarity hesaplanamadı: " + e.getMessage());
            return 0.0;
        }
    }
    
    private List<String> simpleTokenize(String code) {
        // Basit tokenization - kelime bazlı
        return java.util.Arrays.asList(
            code.toLowerCase()
                .replaceAll("[^a-zA-Z0-9\\s]", " ") // Özel karakterleri boşluğa çevir
                .split("\\s+") // Boşluklara göre böl
        ).stream()
        .filter(token -> token.length() > 1) // Tek karakterli token'ları filtrele
        .collect(java.util.stream.Collectors.toList());
    }
    
    private String normalizeCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return "";
        }
        
        // Temel normalizasyon
        return code.trim()
                .replaceAll("\\s+", " ") // Çoklu boşlukları tek boşluğa çevir
                .replaceAll("//.*$", "") // Tek satır yorumları kaldır
                .replaceAll("/\\*.*?\\*/", "") // Çoklu satır yorumları kaldır
                .replaceAll("\\s*\\{\\s*", " { ") // Süslü parantezleri normalize et
                .replaceAll("\\s*\\}\\s*", " } ")
                .replaceAll("\\s*;\\s*", "; ")
                .trim();
    }
    
    public boolean isModelLoaded() {
        return isInitialized;
    }
    
    public void reloadModel() {
        if (model != null) {
            model.close();
        }
        initializeModel();
    }
}
