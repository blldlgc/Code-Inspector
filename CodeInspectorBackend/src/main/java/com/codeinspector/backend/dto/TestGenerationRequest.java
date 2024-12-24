package com.codeinspector.backend.dto;

public record TestGenerationRequest(
    String sourceCode,
    String className
) {} 