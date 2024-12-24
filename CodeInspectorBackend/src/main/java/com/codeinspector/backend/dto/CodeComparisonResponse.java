package com.codeinspector.backend.dto;

import java.util.Map;

public record CodeComparisonResponse(
        Map<String, String> code1Metrics,
        Map<String, String> code2Metrics,
        double CPDsimilarityPercentage,
        double simianSimilarityPercentage,
        String matchedLines
) {}
