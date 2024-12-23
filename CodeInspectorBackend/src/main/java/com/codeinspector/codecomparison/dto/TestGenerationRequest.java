package com.codeinspector.codecomparison.dto;

public record TestGenerationRequest(
    String sourceCode,
    String className
) {} 