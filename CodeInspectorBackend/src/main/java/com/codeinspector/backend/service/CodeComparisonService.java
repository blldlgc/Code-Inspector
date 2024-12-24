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

    public CodeComparisonService(DuplicateCodeDetector duplicateCodeDetector,
                                 CodeMetricsAnalyzer codeMetricsAnalyzer,
                                 SimianAnalyzer simianAnalyzer) {
        this.duplicateCodeDetector = duplicateCodeDetector;
        this.codeMetricsAnalyzer = codeMetricsAnalyzer;
        this.simianAnalyzer = simianAnalyzer;
    }

    public CodeComparisonResponse compareCode(String code1, String code2) {
        var duplicatedLines = duplicateCodeDetector.detectDuplicates(code1, code2);
        double similarityPercentage = duplicateCodeDetector.calculateSimilarityPercentage(code1, code2, duplicatedLines);
        var code1Metrics = codeMetricsAnalyzer.analyzeMetrics(code1);
        var code2Metrics = codeMetricsAnalyzer.analyzeMetrics(code2);

        var simianResult = simianAnalyzer.analyzeSimilarity(code1, code2);

        return new CodeComparisonResponse(
                code1Metrics,
                code2Metrics,
                similarityPercentage,
                simianResult.getSimilarityPercentage(),
                String.join("\n", duplicatedLines) + "\n\nSimian Report:\n" + simianResult.getSimilarityPercentage() + "% Similarity\n" + String.join("\n", simianResult.getDuplicatedLines())
        );
    }

    public CodeMetricsResponse analyzeMetrics(String code) {
        var metrics = codeMetricsAnalyzer.analyzeMetrics(code);
        return new CodeMetricsResponse(metrics);
    }
}
