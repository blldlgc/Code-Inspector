package com.codeinspector.backend.dto;

public class CoverageRequest {

    private String sourceCode;
    private String testCode;

    public CoverageRequest() {}

    public CoverageRequest(String sourceCode, String testCode) {
        this.sourceCode = sourceCode;
        this.testCode = testCode;
    }

    // Getter - Setter
    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getTestCode() {
        return testCode;
    }

    public void setTestCode(String testCode) {
        this.testCode = testCode;
    }
}
