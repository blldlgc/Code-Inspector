package com.codeinspector.codecomparison.dto;

public record TestCoverageRequest(
    String sourceCode,
    String testCode
) {} 