package com.codeinspector.backend.utils;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Component
public class CodeMetricsAnalyzer {

    public Map<String, String> analyzeMetrics(String code) {
        String[] lines = code.strip().split("\n");
        Map<String, String> metrics = new HashMap<>();

        metrics.put("Lines of Code", String.valueOf(lines.length));
        metrics.put("Number of Methods", String.valueOf(countMethods(lines)));
        metrics.put("Number of Classes", String.valueOf(countClasses(lines)));
        metrics.put("Number of Loops", String.valueOf(countLoops(lines)));
        metrics.put("Number of Comments", String.valueOf(countComments(lines)));
        metrics.put("Cyclomatic Complexity", String.valueOf(calculateCyclomaticComplexity(lines)));
        metrics.put("Variable Declarations", String.valueOf(countVariables(lines)));
        metrics.put("Function Calls", String.valueOf(countFunctionCalls(lines)));
        metrics.put("Max Line Length", String.valueOf(maxLineLength(lines)));
        metrics.put("Empty Lines", String.valueOf(countEmptyLines(lines)));

        return metrics;
    }

    private int countMethods(String[] lines) {
        return (int) Arrays.stream(lines)
                .filter(line -> line.trim().matches(".*\\b(public|private|protected)\\b.*\\(.*\\).*\\{?"))
                .count();
    }

    private int countClasses(String[] lines) {
        return (int) Arrays.stream(lines)
                .filter(line -> line.trim().matches(".*\\bclass\\b.*"))
                .count();
    }

    private int countLoops(String[] lines) {
        return (int) Arrays.stream(lines)
                .filter(line -> line.trim().matches(".*\\b(for|while|do)\\b.*"))
                .count();
    }

    private int countComments(String[] lines) {
        return (int) Arrays.stream(lines)
                .filter(line -> line.trim().startsWith("//") || line.trim().startsWith("/*") || line.trim().startsWith("*"))
                .count();
    }

    private int calculateCyclomaticComplexity(String[] lines) {
        return (int) Arrays.stream(lines)
                .filter(line -> line.trim().matches(".*\\b(if|else|for|while|case|catch)\\b.*"))
                .count() + 1;
    }

    private int countVariables(String[] lines) {
        return (int) Arrays.stream(lines)
                .filter(line -> line.trim().matches(".*\\b(int|double|String|boolean|char|float|long|short|byte)\\b.*;"))
                .count();
    }

    private int countFunctionCalls(String[] lines) {
        return (int) Arrays.stream(lines)
                .filter(line -> line.trim().matches(".*\\w+\\(.*\\);"))
                .count();
    }

    private int maxLineLength(String[] lines) {
        return Arrays.stream(lines)
                .mapToInt(String::length)
                .max()
                .orElse(0);
    }

    private int countEmptyLines(String[] lines) {
        return (int) Arrays.stream(lines)
                .filter(String::isBlank)
                .count();
    }
}
