package com.codeinspector.backend.model.security;

import java.util.List;

public record SecurityRecommendation(
    String category,
    String description,
    String recommendation,
    RiskLevel priority,
    List<String> relatedIssues
) {} 