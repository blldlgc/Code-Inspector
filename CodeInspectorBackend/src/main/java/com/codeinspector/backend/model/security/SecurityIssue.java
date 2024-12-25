package com.codeinspector.backend.model.security;

public record SecurityIssue(
    String type,
    String description,
    RiskLevel riskLevel,
    int lineNumber,
    String vulnerableCode,
    String recommendation,
    String impact,
    double issueSeverityScore
) {} 