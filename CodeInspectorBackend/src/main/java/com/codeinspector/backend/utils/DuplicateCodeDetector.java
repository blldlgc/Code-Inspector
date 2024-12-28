package com.codeinspector.backend.utils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

@Component
public class DuplicateCodeDetector {
    private static final int MIN_SEQUENCE_LENGTH = 3; // Minimum kaç satırlık benzerlikleri arayacağımız
    
    public List<String> detectDuplicates(String code1, String code2) {
        if (code1 == null || code2 == null) {
            throw new IllegalArgumentException("Code inputs cannot be null");
        }

        List<String> lines1 = getNormalizedLines(code1);
        List<String> lines2 = getNormalizedLines(code2);
        
        return findDuplicateSequences(lines1, lines2);
    }

    private List<String> findDuplicateSequences(List<String> lines1, List<String> lines2) {
        Set<String> duplicates = new HashSet<>();
        
        // Her bir olası sequence uzunluğu için kontrol
        for (int windowSize = MIN_SEQUENCE_LENGTH; windowSize <= Math.min(lines1.size(), lines2.size()); windowSize++) {
            // İlk kod için tüm olası sequence'ları oluştur
            Map<String, Integer> sequences1 = generateSequences(lines1, windowSize);
            // İkinci kod için tüm olası sequence'ları oluştur
            Map<String, Integer> sequences2 = generateSequences(lines2, windowSize);
            
            // Ortak sequence'ları bul
            for (String sequence : sequences1.keySet()) {
                if (sequences2.containsKey(sequence)) {
                    // Sequence'ı tekil satırlara böl ve duplicate listesine ekle
                    duplicates.addAll(Arrays.asList(sequence.split("\n")));
                }
            }
        }
        
        return new ArrayList<>(duplicates);
    }

    private Map<String, Integer> generateSequences(List<String> lines, int windowSize) {
        Map<String, Integer> sequences = new HashMap<>();
        
        for (int i = 0; i <= lines.size() - windowSize; i++) {
            String sequence = lines.subList(i, i + windowSize)
                    .stream()
                    .collect(Collectors.joining("\n"));
            sequences.put(sequence, i);
        }
        
        return sequences;
    }

    public double calculateSimilarityPercentage(String code1, String code2, List<String> duplicatedLines) {
        List<String> lines1 = getNormalizedLines(code1);
        List<String> lines2 = getNormalizedLines(code2);
        
        Set<String> uniqueDuplicatedLines = new HashSet<>(duplicatedLines);
        int duplicateLineCount = uniqueDuplicatedLines.size();
        
        // Eğer aynı kod parçaları karşılaştırılıyorsa
        if (code1.equals(code2)) {
            return 100.0;
        }
        
        // Normal karşılaştırma için
        int totalUniqueLines = new HashSet<>(lines1).size() + new HashSet<>(lines2).size();
        if (totalUniqueLines == 0) return 0.0;
        
        return Math.min(100.0, (duplicateLineCount * 2.0 * 100.0) / totalUniqueLines);
    }

    private List<String> getNormalizedLines(String code) {
        return Arrays.stream(code.split("\n"))
                .map(String::strip)
                .filter(this::isValidCodeLine)
                .collect(Collectors.toList());
    }

    private boolean isValidCodeLine(String line) {
        return !line.isEmpty() && 
               !line.equals("}") && 
               !line.equals("{") &&
               !line.trim().startsWith("//") && // Yorumları görmezden gel
               !line.trim().startsWith("/*") && // Çoklu satır yorumlarını görmezden gel
               !line.trim().startsWith("*"); // Javadoc satırlarını görmezden gel
    }
}
