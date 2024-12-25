package com.codeinspector.backend.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CodeAnalysisResult {
    private Map<String, Double> smellScores;
    private Map<String, List<String>> smellDetails;
    private double overallScore;
}