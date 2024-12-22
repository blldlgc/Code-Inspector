package com.codeinspector.codecomparison.dto;

import com.codeinspector.codecomparison.model.MethodCoverage;
import java.util.Map;

public record TestCoverageResponse(
    double coveragePercentage,
    int coveredInstructions,
    int totalInstructions,
    Map<String, MethodCoverage> methodCoverages
) {} 