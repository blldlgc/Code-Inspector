package com.codeinspector.backend.utils;

import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;


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

        HalsteadMetrics halstead = calculateHalsteadMetrics(lines);
        metrics.put("Halstead Program Length", String.format("%.2f", halstead.getProgramLength()));
        metrics.put("Halstead Vocabulary", String.format("%.2f", halstead.getVocabulary()));
        metrics.put("Halstead Volume", String.format("%.2f", halstead.getVolume()));
        metrics.put("Halstead Difficulty", String.format("%.2f", halstead.getDifficulty()));
        metrics.put("Halstead Effort", String.format("%.2f", halstead.getEffort()));
        metrics.put("Halstead Time", String.format("%.2f", halstead.getTime()));
        metrics.put("Halstead Bugs", String.format("%.2f", halstead.getBugs()));

        double maintainabilityIndex = calculateMaintainabilityIndex(lines);
        metrics.put("Maintainability Index", String.format("%.2f", maintainabilityIndex));

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

    private static class HalsteadMetrics {
        private final int n1; // benzersiz operatör sayısı
        private final int n2; // benzersiz operand sayısı
        private final int N1; // toplam operatör sayısı
        private final int N2; // toplam operand sayısı

        public HalsteadMetrics(int n1, int n2, int N1, int N2) {
            this.n1 = n1;
            this.n2 = n2;
            this.N1 = N1;
            this.N2 = N2;
        }

        public double getProgramLength() {
            return N1 + N2;
        }

        public double getVocabulary() {
            return n1 + n2;
        }

        public double getVolume() {
            return getProgramLength() * (Math.log(getVocabulary()) / Math.log(2));
        }

        public double getDifficulty() {
            return (n1 * N2) / (2.0 * n2);
        }

        public double getEffort() {
            return getDifficulty() * getVolume();
        }

        public double getTime() {
            return getEffort() / 18.0;
        }

        public double getBugs() {
            return getVolume() / 3000.0;
        }
    }

    private HalsteadMetrics calculateHalsteadMetrics(String[] lines) {
        Set<String> uniqueOperators = new HashSet<>();
        Set<String> uniqueOperands = new HashSet<>();
        int totalOperators = 0;
        int totalOperands = 0;

        // Operatörler için regex pattern
        Pattern operatorPattern = Pattern.compile("[+\\-*/=<>!&|^%]|\\b(if|else|while|for|return|new)\\b");
        
        // Operandlar için regex pattern
        Pattern operandPattern = Pattern.compile("\\b[a-zA-Z_]\\w*\\b|\\b\\d+\\b|\"[^\"]*\"");

        for (String line : lines) {
            // Operatörleri bul
            Matcher operatorMatcher = operatorPattern.matcher(line);
            while (operatorMatcher.find()) {
                uniqueOperators.add(operatorMatcher.group());
                totalOperators++;
            }

            // Operandları bul
            Matcher operandMatcher = operandPattern.matcher(line);
            while (operandMatcher.find()) {
                uniqueOperands.add(operandMatcher.group());
                totalOperands++;
            }
        }

        return new HalsteadMetrics(
            uniqueOperators.size(),
            uniqueOperands.size(),
            totalOperators,
            totalOperands
        );
    }

    private double calculateMaintainabilityIndex(String[] lines) {
        // Halstead Volume hesapla (mevcut implementasyondan)
        HalsteadMetrics halstead = calculateHalsteadMetrics(lines);
        double halsteadVolume = halstead.getVolume();
        
        // Cyclomatic Complexity hesapla (mevcut implementasyondan)
        double cyclomaticComplexity = calculateCyclomaticComplexity(lines);
        
        // Lines of Code (yorum satırları hariç)
        int loc = (int) Arrays.stream(lines)
                .filter(line -> !line.trim().startsWith("//") && !line.trim().startsWith("/*"))
                .filter(line -> !line.trim().isEmpty())
                .count();

        // Maintainability Index formülü:
        // MI = 171 - 5.2 * ln(HV) - 0.23 * CC - 16.2 * ln(LOC)
        double mi = 171 
                  - 5.2 * Math.log(halsteadVolume) 
                  - 0.23 * cyclomaticComplexity 
                  - 16.2 * Math.log(loc);

        // 0-100 aralığına normalize et
        return Math.max(0, Math.min(100, mi));
    }
}
