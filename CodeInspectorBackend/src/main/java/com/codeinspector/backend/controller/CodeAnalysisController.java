package com.codeinspector.backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeinspector.backend.dto.CodeAnalysisResult;
import com.codeinspector.backend.utils.CodeSmellAnalyzer;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/code-analysis")
public class CodeAnalysisController {
    
    private final CodeSmellAnalyzer analyzer = new CodeSmellAnalyzer();

    @PostMapping("/analyze")
    public CodeAnalysisResult analyzeCode(@RequestBody String sourceCode) {
        return analyzer.analyzeCode(sourceCode);
    }
}