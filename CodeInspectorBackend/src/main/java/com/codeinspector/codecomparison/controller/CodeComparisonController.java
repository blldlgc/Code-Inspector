package com.codeinspector.codecomparison.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeinspector.codecomparison.dto.CodeComparisonRequest;
import com.codeinspector.codecomparison.dto.CodeComparisonResponse;
import com.codeinspector.codecomparison.dto.CodeMetricsRequest;
import com.codeinspector.codecomparison.dto.CodeMetricsResponse;
import com.codeinspector.codecomparison.dto.TestCoverageRequest;
import com.codeinspector.codecomparison.dto.TestCoverageResponse;
import com.codeinspector.codecomparison.service.CodeComparisonService;
import com.codeinspector.codecomparison.utils.TestCoverageAnalyzer;

@RestController
@RequestMapping("/api/code")
@CrossOrigin(origins = "http://localhost:3000")
public class CodeComparisonController {

    private final CodeComparisonService codeComparisonService;
    private final TestCoverageAnalyzer testCoverageAnalyzer;

    @Autowired
    public CodeComparisonController(
            CodeComparisonService codeComparisonService,
            TestCoverageAnalyzer testCoverageAnalyzer) {
        this.codeComparisonService = codeComparisonService;
        this.testCoverageAnalyzer = testCoverageAnalyzer;
    }

    @PostMapping("/compare")
    public CodeComparisonResponse compareCode(@RequestBody CodeComparisonRequest request) {
        return codeComparisonService.compareCode(request.code1(), request.code2());
    }

    @PostMapping("/metrics")
    public CodeMetricsResponse analyzeMetrics(@RequestBody CodeMetricsRequest request) {
        return codeComparisonService.analyzeMetrics(request.code());
    }

    @PostMapping("/coverage")
    public TestCoverageResponse analyzeCoverage(@RequestBody TestCoverageRequest request) {
        var result = testCoverageAnalyzer.analyzeCoverage(
            request.sourceCode(),
            request.testCode()
        );
        return new TestCoverageResponse(
            result.getCoveragePercentage(),
            result.getCoveredInstructions(),
            result.getTotalInstructions(),
            result.getMethodCoverages()
        );
    }
}