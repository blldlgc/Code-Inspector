package com.codeinspector.backend.utils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import com.codeinspector.backend.model.MethodCoverage;

@Component
public class TestCoverageAnalyzer {
    
    public static class CoverageResult {
        private final double coveragePercentage;
        private final int coveredInstructions;
        private final int totalInstructions;
        private final Map<String, MethodCoverage> methodCoverages;
        
        public CoverageResult(
                double coveragePercentage,
                int coveredInstructions,
                int totalInstructions,
                Map<String, MethodCoverage> methodCoverages) {
            this.coveragePercentage = coveragePercentage;
            this.coveredInstructions = coveredInstructions;
            this.totalInstructions = totalInstructions;
            this.methodCoverages = methodCoverages;
        }
        
        public double getCoveragePercentage() {
            return coveragePercentage;
        }
        
        public int getCoveredInstructions() {
            return coveredInstructions;
        }
        
        public int getTotalInstructions() {
            return totalInstructions;
        }
        
        public Map<String, MethodCoverage> getMethodCoverages() {
            return methodCoverages;
        }
    }

    public CoverageResult analyzeCoverage(String sourceCode, String testCode) {
        Map<String, List<String>> methods = extractMethods(sourceCode);
        Set<String> testedMethods = findTestedMethods(testCode);
        Map<String, MethodCoverage> methodCoverages = calculateMethodCoverages(methods, testedMethods);
        
        int totalInstructions = calculateTotalInstructions(methods);
        int coveredInstructions = calculateCoveredInstructions(methodCoverages);
        double coveragePercentage = totalInstructions > 0 
            ? (coveredInstructions * 100.0) / totalInstructions 
            : 0.0;
        
        return new CoverageResult(
            coveragePercentage,
            coveredInstructions,
            totalInstructions,
            methodCoverages
        );
    }

    private Map<String, List<String>> extractMethods(String sourceCode) {
        Map<String, List<String>> methods = new HashMap<>();
        Pattern methodPattern = Pattern.compile("(public|private|protected)\\s+\\w+\\s+\\w+\\s*\\([^)]*\\)\\s*\\{");
        String[] lines = sourceCode.split("\n");
        
        String currentMethod = null;
        List<String> currentMethodLines = new ArrayList<>();
        
        for (String line : lines) {
            Matcher matcher = methodPattern.matcher(line);
            if (matcher.find()) {
                if (currentMethod != null) {
                    methods.put(currentMethod, currentMethodLines);
                }
                currentMethod = line.trim();
                currentMethodLines = new ArrayList<>();
            } else if (currentMethod != null) {
                currentMethodLines.add(line.trim());
            }
        }
        
        if (currentMethod != null) {
            methods.put(currentMethod, currentMethodLines);
        }
        
        return methods;
    }

    private Set<String> findTestedMethods(String testCode) {
        Set<String> testedMethods = new HashSet<>();
        Pattern testPattern = Pattern.compile("@Test|test\\w+\\(");
        String[] lines = testCode.split("\n");
        
        for (String line : lines) {
            Matcher matcher = testPattern.matcher(line);
            if (matcher.find()) {
                extractTestedMethodName(line).ifPresent(testedMethods::add);
            }
        }
        
        return testedMethods;
    }

    private Optional<String> extractTestedMethodName(String line) {
        Pattern methodNamePattern = Pattern.compile("test(\\w+)\\(");
        Matcher matcher = methodNamePattern.matcher(line);
        if (matcher.find()) {
            return Optional.of(matcher.group(1).toLowerCase());
        }
        return Optional.empty();
    }

    private Map<String, MethodCoverage> calculateMethodCoverages(
            Map<String, List<String>> methods, 
            Set<String> testedMethods) {
        Map<String, MethodCoverage> coverages = new HashMap<>();
        
        methods.forEach((methodName, lines) -> {
            boolean isTested = testedMethods.stream()
                    .anyMatch(testName -> methodName.toLowerCase().contains(testName));
            int totalLines = lines.size();
            int coveredLines = isTested ? totalLines : 0;
            
            coverages.put(methodName, new MethodCoverage(
                methodName,
                coveredLines,
                totalLines
            ));
        });
        
        return coverages;
    }

    private int calculateTotalInstructions(Map<String, List<String>> methods) {
        return methods.values().stream()
                .mapToInt(List::size)
                .sum();
    }

    private int calculateCoveredInstructions(Map<String, MethodCoverage> methodCoverages) {
        return methodCoverages.values().stream()
                .mapToInt(MethodCoverage::getCoveredLines)
                .sum();
    }
} 