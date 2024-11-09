package com.codeinspector.codecomparision.dto;

public record CodeComparisonResponse(double similarityPercentage, String matchedLines) {}