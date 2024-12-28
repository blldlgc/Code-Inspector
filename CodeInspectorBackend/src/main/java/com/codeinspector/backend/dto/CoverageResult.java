package com.codeinspector.backend.dto;

import java.util.Map;


public class CoverageResult {

    private double coveragePercentage;
    private int coveredLines;
    private int totalLines;
    private Map<String, int[]> methodCoverage;

    // Parametresiz kurucu (no-args constructor)
    public CoverageResult() {
    }

    // Parametreli kurucu (fields ile birlikte)
    public CoverageResult(double coveragePercentage, int coveredLines, int totalLines,
                          Map<String, int[]> methodCoverage) {
        this.coveragePercentage = coveragePercentage;
        this.coveredLines = coveredLines;
        this.totalLines = totalLines;
        this.methodCoverage = methodCoverage;
    }

    // Getter ve Setter'lar

    public double getCoveragePercentage() {
        return coveragePercentage;
    }

    public void setCoveragePercentage(double coveragePercentage) {
        this.coveragePercentage = coveragePercentage;
    }

    public int getCoveredLines() {
        return coveredLines;
    }

    public void setCoveredLines(int coveredLines) {
        this.coveredLines = coveredLines;
    }

    public int getTotalLines() {
        return totalLines;
    }

    public void setTotalLines(int totalLines) {
        this.totalLines = totalLines;
    }

    public Map<String, int[]> getMethodCoverage() {
        return methodCoverage;
    }

    public void setMethodCoverage(Map<String, int[]> methodCoverage) {
        this.methodCoverage = methodCoverage;
    }
}
