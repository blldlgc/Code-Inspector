package com.codeinspector.backend.service;

import org.springframework.stereotype.Service;

import com.codeinspector.backend.dto.CodeComparisonResponse;
import com.codeinspector.backend.dto.CodeMetricsResponse;
import com.codeinspector.backend.utils.CodeMetricsAnalyzer;
import com.codeinspector.backend.utils.DuplicateCodeDetector;
import com.codeinspector.backend.utils.SimianAnalyzer;
import com.codeinspector.backend.utils.CodeBERTAnalyzer;

@Service
public class CodeComparisonService {

    private final DuplicateCodeDetector duplicateCodeDetector;
    private final CodeMetricsAnalyzer codeMetricsAnalyzer;
    private final SimianAnalyzer simianAnalyzer;
    private final CodeBERTAnalyzer codeBERTAnalyzer;

    public CodeComparisonService(DuplicateCodeDetector duplicateCodeDetector,
                                 CodeMetricsAnalyzer codeMetricsAnalyzer,
                                 SimianAnalyzer simianAnalyzer,
                                 CodeBERTAnalyzer codeBERTAnalyzer) {
        this.duplicateCodeDetector = duplicateCodeDetector;
        this.codeMetricsAnalyzer = codeMetricsAnalyzer;
        this.simianAnalyzer = simianAnalyzer;
        this.codeBERTAnalyzer = codeBERTAnalyzer;
    }

    public CodeComparisonResponse compareCode(String code1, String code2) {
        var duplicatedLines = duplicateCodeDetector.detectDuplicates(code1, code2);
        double similarityPercentage = duplicateCodeDetector.calculateSimilarityPercentage(code1, code2, duplicatedLines);
        var code1Metrics = codeMetricsAnalyzer.analyzeMetrics(code1);
        var code2Metrics = codeMetricsAnalyzer.analyzeMetrics(code2);

        var simianResult = simianAnalyzer.analyzeSimilarity(code1, code2);
        
        // CodeBERT semantic similarity hesapla
        double codeBERTSimilarity = codeBERTAnalyzer.calculateSemanticSimilarity(code1, code2);
        
        // Hybrid similarity hesapla (ağırlıklı ortalama)
        double hybridSimilarity = calculateHybridSimilarity(
            similarityPercentage, 
            simianResult.getSimilarityPercentage(), 
            codeBERTSimilarity
        );

        return new CodeComparisonResponse(
                code1Metrics,
                code2Metrics,
                similarityPercentage,
                simianResult.getSimilarityPercentage(),
                codeBERTSimilarity,
                hybridSimilarity,
                String.join("\n", duplicatedLines) + "\n\nSimian Report:\n" + simianResult.getSimilarityPercentage() + "% Similarity\n" + String.join("\n", simianResult.getDuplicatedLines()) + "\n\nCodeBERT Report:\n" + codeBERTSimilarity + "% Semantic Similarity"
        );
    }
    
    private double calculateHybridSimilarity(double cpdSimilarity, double simianSimilarity, double codeBERTSimilarity) {
        // Ağırlıklı ortalama: CPD %30, Simian %30, CodeBERT %40
        return (cpdSimilarity * 0.3) + (simianSimilarity * 0.3) + (codeBERTSimilarity * 0.4);
    }

    public CodeMetricsResponse analyzeMetrics(String code) {
        var metrics = codeMetricsAnalyzer.analyzeMetrics(code);
        return new CodeMetricsResponse(metrics);
    }
}
