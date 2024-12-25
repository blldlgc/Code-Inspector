package com.codeinspector.backend.dto;

import com.codeinspector.backend.model.security.RiskMetrics;
import com.codeinspector.backend.model.security.SecurityIssue;
import com.codeinspector.backend.model.security.SecurityRecommendation;

import java.util.List;
import java.util.Map;

public record SecurityAnalysisResult(
    Map<String, List<SecurityIssue>> vulnerabilities,
    List<SecurityRecommendation> recommendations,
    RiskMetrics riskMetrics,
    String securityReport
) {} 