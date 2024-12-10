package com.codeinspector.codecomparison.service;

import com.codeinspector.codecomparison.dto.CodeComparisonResponse;
import com.codeinspector.codecomparison.utils.CodeMetricsAnalyzer;
import com.codeinspector.codecomparison.utils.DuplicateCodeDetector;
import com.codeinspector.codecomparison.utils.SimianAnalyzer;
import org.springframework.stereotype.Service;

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
}
