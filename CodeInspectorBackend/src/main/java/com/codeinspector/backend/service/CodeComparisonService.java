package com.codeinspector.backend.service;

import org.springframework.stereotype.Service;

import com.codeinspector.backend.dto.CodeComparisonResponse;
import com.codeinspector.backend.dto.CodeMetricsResponse;
import com.codeinspector.backend.utils.CodeMetricsAnalyzer;
import com.codeinspector.backend.utils.DuplicateCodeDetector;
import com.codeinspector.backend.utils.SimianAnalyzer;

@Service
public class CodeComparisonService {

    private final DuplicateCodeDetector duplicateCodeDetector;
    private final CodeMetricsAnalyzer codeMetricsAnalyzer;
    private final SimianAnalyzer simianAnalyzer;
    private final CodeBertService codeBertService;

    public CodeComparisonService(DuplicateCodeDetector duplicateCodeDetector,
                                 CodeMetricsAnalyzer codeMetricsAnalyzer,
                                 SimianAnalyzer simianAnalyzer,
                                 CodeBertService codeBertService) {
        this.duplicateCodeDetector = duplicateCodeDetector;
        this.codeMetricsAnalyzer = codeMetricsAnalyzer;
        this.simianAnalyzer = simianAnalyzer;
        this.codeBertService = codeBertService;
    }

    public CodeComparisonResponse compareCode(String code1, String code2) {
        // Mevcut analizleri yap
        var duplicatedLines = duplicateCodeDetector.detectDuplicates(code1, code2);
        double similarityPercentage = duplicateCodeDetector.calculateSimilarityPercentage(code1, code2, duplicatedLines);
        var code1Metrics = codeMetricsAnalyzer.analyzeMetrics(code1);
        var code2Metrics = codeMetricsAnalyzer.analyzeMetrics(code2);
        var simianResult = simianAnalyzer.analyzeSimilarity(code1, code2);

        // CodeBERT analizi yap
        var codeBertResult = codeBertService.compareCodes(code1, code2);

        // Tüm sonuçları birleştir
        return new CodeComparisonResponse(
                code1Metrics,
                code2Metrics,
                similarityPercentage,
                simianResult.getSimilarityPercentage(),
                codeBertResult.cosine() * 100, // CodeBERT sonucunu yüzdelik değere çevir
                calculateHybridSimilarity(
                    codeBertResult.cosine() * 100,  // CodeBERT (cosine * 100 ile yüzdelik değere çevrildi)
                    similarityPercentage,           // CPD
                    simianResult.getSimilarityPercentage() // Simian
                ),
                String.join("\n", duplicatedLines) + "\n\nSimian Report:\n" + simianResult.getSimilarityPercentage() + "% Similarity\n" + String.join("\n", simianResult.getDuplicatedLines())
        );
    }

    /**
     * Hızlı karşılaştırma - sadece CPD analizi yapar (Simian ve CodeBERT çalıştırmaz)
     * Performans optimizasyonu için kullanılır
     */
    public double compareCodeFast(String code1, String code2) {
        var duplicatedLines = duplicateCodeDetector.detectDuplicates(code1, code2);
        return duplicateCodeDetector.calculateSimilarityPercentage(code1, code2, duplicatedLines);
    }

    public CodeMetricsResponse analyzeMetrics(String code) {
        var metrics = codeMetricsAnalyzer.analyzeMetrics(code);
        return new CodeMetricsResponse(metrics);
    }

    /**
     * Hybrid benzerlik skorunu hesaplar
     * CodeBERT: %40
     * CPD: %30
     * Simian: %30
     */
    private double calculateHybridSimilarity(double codeBertScore, double cpdScore, double simianScore) {
        final double CODEBERT_WEIGHT = 0.4;
        final double CPD_WEIGHT = 0.3;
        final double SIMIAN_WEIGHT = 0.3;

        return (codeBertScore * CODEBERT_WEIGHT) + 
               (cpdScore * CPD_WEIGHT) + 
               (simianScore * SIMIAN_WEIGHT);
    }
}
