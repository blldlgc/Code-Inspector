package com.codeinspector.backend.dto;

public record TestCoverageRequest(
    String sourceCode,
    String testCode
) {} 