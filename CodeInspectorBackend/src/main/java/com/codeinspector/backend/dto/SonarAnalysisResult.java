package com.codeinspector.backend.dto;

public class SonarAnalysisResult {
    private int bugs;
    private int vulnerabilities;
    private int codeSmells;
    private double duplicatedLinesDensity;
    private double coverage;

    public SonarAnalysisResult(int bugs, int vulnerabilities, int codeSmells, double duplicatedLinesDensity, double coverage) {
        this.bugs = bugs;
        this.vulnerabilities = vulnerabilities;
        this.codeSmells = codeSmells;
        this.duplicatedLinesDensity = duplicatedLinesDensity;
        this.coverage = coverage;
    }

    // Getters and Setters
    public int getBugs() {
        return bugs;
    }

    public void setBugs(int bugs) {
        this.bugs = bugs;
    }

    public int getVulnerabilities() {
        return vulnerabilities;
    }

    public void setVulnerabilities(int vulnerabilities) {
        this.vulnerabilities = vulnerabilities;
    }

    public int getCodeSmells() {
        return codeSmells;
    }

    public void setCodeSmells(int codeSmells) {
        this.codeSmells = codeSmells;
    }

    public double getDuplicatedLinesDensity() {
        return duplicatedLinesDensity;
    }

    public void setDuplicatedLinesDensity(double duplicatedLinesDensity) {
        this.duplicatedLinesDensity = duplicatedLinesDensity;
    }

    public double getCoverage() {
        return coverage;
    }

    public void setCoverage(double coverage) {
        this.coverage = coverage;
    }
}