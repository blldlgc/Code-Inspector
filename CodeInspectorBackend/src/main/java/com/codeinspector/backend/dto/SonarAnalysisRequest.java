package com.codeinspector.backend.dto;

public class SonarAnalysisRequest {
    private String sourceCode;
    private String projectKey;

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public String getProjectKey() {
        return "projectKey";
    }

    public void setProjectKey(String projectKey) {
        this.projectKey = projectKey;
    }
}
