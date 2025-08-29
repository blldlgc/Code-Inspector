package com.codeinspector.backend.dto;

import java.util.Map;

public record CodeComparisonResponse(
        Map<String, String> code1Metrics,
        Map<String, String> code2Metrics,
        double CPDsimilarityPercentage,
        double simianSimilarityPercentage,
        double codeBertSimilarityScore,
        double hybridSimilarityPercentage,  // Ağırlıklı ortalama: CodeBERT %40, CPD %30, Simian %30
        String matchedLines
) {}
