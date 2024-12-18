package com.codeinspector.codecomparison.dto;

public class CoverageRequest {
    private String appCode;
    private String testCode;

    // Getters and Setters
    public String getAppCode() {
        return appCode;
    }

    public void setAppCode(String appCode) {
        this.appCode = appCode;
    }

    public String getTestCode() {
        return testCode;
    }

    public void setTestCode(String testCode) {
        this.testCode = testCode;
    }
}
