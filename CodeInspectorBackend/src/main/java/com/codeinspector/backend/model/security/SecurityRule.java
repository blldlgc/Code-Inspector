package com.codeinspector.backend.model.security;

import java.util.function.Predicate;

public record SecurityRule(
    String ruleId,
    Predicate<String> condition,
    RiskLevel riskLevel,
    String description,
    String recommendation
) {} 