package com.codeinspector.codecomparison.dto;

public class CoverageResponse {
    private double coverage;
    private String message;

    // Constructor
    public CoverageResponse(double coverage, String message) {
        this.coverage = coverage;
        this.message = message;
    }

    // Getters and Setters
    public double getCoverage() {
        return coverage;
    }

    public void setCoverage(double coverage) {
        this.coverage = coverage;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
