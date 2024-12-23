package com.codeinspector.codecomparison.controller;

import java.util.Arrays;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import com.codeinspector.codecomparison.dto.TestGenerationRequest;
import com.codeinspector.codecomparison.dto.TestGenerationResponse;
import com.codeinspector.codecomparison.service.CodeComparisonService;
import com.codeinspector.codecomparison.utils.TestCoverageAnalyzer;
import com.codeinspector.codecomparison.utils.TestGenerator;

@RestController
@RequestMapping("/api/code")
@CrossOrigin(origins = "http://localhost:3000")
public class CodeComparisonController {

    private final CodeComparisonService codeComparisonService;
    private final TestCoverageAnalyzer testCoverageAnalyzer;
    private final TestGenerator testGenerator;

    @Autowired
    public CodeComparisonController(
            CodeComparisonService codeComparisonService,
            TestCoverageAnalyzer testCoverageAnalyzer,
            TestGenerator testGenerator) {
        this.codeComparisonService = codeComparisonService;
        this.testCoverageAnalyzer = testCoverageAnalyzer;
        this.testGenerator = testGenerator;
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

    @PostMapping("/generate-test")
    public ResponseEntity<TestGenerationResponse> generateTest(@RequestBody TestGenerationRequest request) {
        try {
            String testCode = testGenerator.generateTest(request.sourceCode());
            String className = testCode.split("public class ")[1].split("Test")[0];
            int numberOfTests = (int) Arrays.stream(testCode.split("\n"))
                .filter(line -> line.trim().startsWith("@Test"))
                .count();
            
            TestCoverageAnalyzer.CoverageResult coverageResult = testCoverageAnalyzer.analyzeCoverage(
                request.sourceCode(),
                testCode
            );
            
            return ResponseEntity.ok().body(new TestGenerationResponse(
                testCode,
                className,
                numberOfTests,
                true,
                null,
                coverageResult.getCoveragePercentage(),
                coverageResult.getCoveredInstructions(),
                coverageResult.getTotalInstructions(),
                coverageResult.getMethodCoverages()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new TestGenerationResponse(
                    null,
                    null,
                    0,
                    false,
                    e.getMessage(),
                    0.0,
                    0,
                    0,
                    Map.of()
                ));
        }
    }
}