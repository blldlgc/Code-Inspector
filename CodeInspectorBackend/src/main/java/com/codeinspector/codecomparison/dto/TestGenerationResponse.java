package com.codeinspector.codecomparison.dto;

import java.util.Map;

import com.codeinspector.codecomparison.model.MethodCoverage;

public record TestGenerationResponse(
    String testCode,
    String className,
    int numberOfTests,
    boolean success,
    String errorMessage,
    double coveragePercentage,
    int coveredInstructions,
    int totalInstructions,
    Map<String, MethodCoverage> methodCoverages
) {} 