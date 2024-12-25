package com.codeinspector.backend.dto;

import java.util.List;
import java.util.Map;



public class CodeAnalysisResult {
    private final Map<String, Double> smellScores;
    private final Map<String, List<String>> smellDetails;
    private final double overallScore;

    public CodeAnalysisResult(Map<String, Double> smellScores, 
                            Map<String, List<String>> smellDetails, 
                            double overallScore) {
        this.smellScores = smellScores;
        this.smellDetails = smellDetails;
        this.overallScore = overallScore;
    }

    public Map<String, Double> getSmellScores() {
        return smellScores;
    }

    public Map<String, List<String>> getSmellDetails() {
        return smellDetails;
    }

    public double getOverallScore() {
        return overallScore;
    }
}