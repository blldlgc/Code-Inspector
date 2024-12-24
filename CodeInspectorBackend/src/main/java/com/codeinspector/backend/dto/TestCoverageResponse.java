package com.codeinspector.backend.dto;

import com.codeinspector.backend.model.MethodCoverage;
import java.util.Map;

public record TestCoverageResponse(
    double coveragePercentage,
    int coveredInstructions,
    int totalInstructions,
    Map<String, MethodCoverage> methodCoverages
) {} 