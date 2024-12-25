package com.codeinspector.backend.service;

import org.springframework.stereotype.Service;

import com.codeinspector.backend.dto.SecurityAnalysisResult;
import com.codeinspector.backend.utils.AdvancedSecurityAnalyzer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SecurityService {
    
    private final AdvancedSecurityAnalyzer securityAnalyzer;

    public SecurityAnalysisResult analyzeCode(String sourceCode) {
        return securityAnalyzer.analyzeCode(sourceCode);
    }
} 