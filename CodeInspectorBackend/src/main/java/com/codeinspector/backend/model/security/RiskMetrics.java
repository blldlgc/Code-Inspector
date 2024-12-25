package com.codeinspector.backend.model.security;

import java.util.Map;

public record RiskMetrics(
    double overallRiskScore,
    int criticalIssues,
    int highIssues,
    int mediumIssues,
    int lowIssues,
    double codeQualityScore,
    double securityScore,
    Map<String, Double> categoryScores
) {} 