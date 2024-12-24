package com.codeinspector.backend.model;

public class MethodCoverage {
    private final String methodName;
    private final int coveredLines;
    private final int totalLines;
    
    public MethodCoverage(String methodName, int coveredLines, int totalLines) {
        this.methodName = methodName;
        this.coveredLines = coveredLines;
        this.totalLines = totalLines;
    }

    public String getMethodName() {
        return methodName;
    }

    public int getCoveredLines() {
        return coveredLines;
    }

    public int getTotalLines() {
        return totalLines;
    }
} 