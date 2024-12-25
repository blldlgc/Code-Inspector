package com.codeinspector.backend.utils;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.codeinspector.backend.dto.CodeAnalysisResult;

public class CodeSmellAnalyzer {
    private final Map<String, Double> smellScores = new HashMap<>();
    private final Map<String, List<String>> smellDetails = new HashMap<>();

    public CodeAnalysisResult analyzeCode(String sourceCode) {
        smellScores.clear();
        smellDetails.clear();

        // Tüm code smell analizlerini yap
        analyzeLongMethod(sourceCode);
        analyzeLargeClass(sourceCode);
        analyzeDuplicateCode(sourceCode);
        analyzeLongParameterList(sourceCode);
        analyzeComplexity(sourceCode);
        analyzeNaming(sourceCode);
        analyzeDataClumps(sourceCode);
        analyzeSwitchStatements(sourceCode);

        // Genel kod kalite skorunu hesapla
        double overallScore = calculateOverallScore();

        return new CodeAnalysisResult(smellScores, smellDetails, overallScore);
    }

    private void analyzeLongMethod(String sourceCode) {
        Pattern methodPattern = Pattern.compile("\\w+\\s+\\w+\\s*\\([^)]*\\)\\s*\\{([^}]*?)\\}");
        Matcher matcher = methodPattern.matcher(sourceCode);
        List<String> longMethods = new ArrayList<>();
        int totalMethods = 0;
        int longMethodCount = 0;

        while (matcher.find()) {
            totalMethods++;
            String methodBody = matcher.group(1);
            int lines = methodBody.split("\n").length;
            if (lines > 20) {
                longMethodCount++;
                longMethods.add("Method with " + lines + " lines found");
            }
        }

        double score = totalMethods > 0 ? (1 - ((double) longMethodCount / totalMethods)) * 100 : 100;
        smellScores.put("Long Methods", score);
        smellDetails.put("Long Methods", longMethods);
    }

    private void analyzeLargeClass(String sourceCode) {
        int methodCount = countMethods(sourceCode);
        List<String> largeClassIssues = new ArrayList<>();

        if (methodCount > 10) {
            largeClassIssues.add("Class has " + methodCount + " methods (recommended: max 10)");
            double score = Math.max(0, 100 - ((methodCount - 10) * 5));
            smellScores.put("Large Class", score);
        } else {
            largeClassIssues.add("Class has " + methodCount + " methods (good practice)");
            smellScores.put("Large Class", 100.0);
        }
        
        if (!largeClassIssues.isEmpty()) {
            smellDetails.put("Large Class", largeClassIssues);
        }
    }

    private void analyzeDuplicateCode(String sourceCode) {
        String[] lines = sourceCode.split("\n");
        Map<String, Integer> lineFrequency = new HashMap<>();
        List<String> duplicateIssues = new ArrayList<>();
        
        for (String line : lines) {
            line = line.trim();
            if (line.length() > 10) {
                lineFrequency.put(line, lineFrequency.getOrDefault(line, 0) + 1);
            }
        }

        int duplicateCount = 0;
        for (Map.Entry<String, Integer> entry : lineFrequency.entrySet()) {
            if (entry.getValue() > 1) {
                duplicateCount++;
                duplicateIssues.add("Line appears " + entry.getValue() + " times: " + entry.getKey());
            }
        }

        double score = Math.max(0, 100 - (duplicateCount * 10));
        smellScores.put("Duplicate Code", score);
        smellDetails.put("Duplicate Code", duplicateIssues);
    }

    private void analyzeLongParameterList(String sourceCode) {
        Pattern methodPattern = Pattern.compile("\\w+\\s+\\w+\\s*\\((.*?)\\)");
        Matcher matcher = methodPattern.matcher(sourceCode);
        List<String> parameterIssues = new ArrayList<>();
        
        while (matcher.find()) {
            String parameters = matcher.group(1);
            if (!parameters.isEmpty()) {
                int paramCount = parameters.split(",").length;
                if (paramCount > 3) {
                    parameterIssues.add("Method has " + paramCount + " parameters (recommended: max 3)");
                }
            }
        }

        double score = parameterIssues.isEmpty() ? 100 : Math.max(0, 100 - (parameterIssues.size() * 15));
        smellScores.put("Long Parameter List", score);
        smellDetails.put("Long Parameter List", parameterIssues);
    }

    private void analyzeComplexity(String sourceCode) {
        // McCabe Cyclomatic Complexity için kontrol edilecek yapılar
        Pattern complexityPattern = Pattern.compile(
            "if\\s*\\(|else\\s*\\{|while\\s*\\(|for\\s*\\(|case\\s+.*:|catch\\s*\\(|\\|\\||&&|\\?|throw\\s+new"
        );
        Matcher matcher = complexityPattern.matcher(sourceCode);
        
        int mccComplexity = 1; // Başlangıç değeri 1 (temel yol)
        List<String> complexityIssues = new ArrayList<>();
        
        // Karmaşıklık noktalarını say
        while (matcher.find()) {
            mccComplexity++;
        }
        
        // McCabe'e göre karmaşıklık değerlendirmesi
        String complexityLevel;
        double score;
        
        if (mccComplexity <= 10) {
            // 1-10 arası: Basit, iyi yapılandırılmış kod
            complexityLevel = "Simple";
            score = 100.0;
        } else if (mccComplexity <= 20) {
            // 11-20 arası: Orta karmaşıklık
            complexityLevel = "Moderate";
            score = 80.0 - ((mccComplexity - 10) * 3);
        } else if (mccComplexity <= 30) {
            // 21-30 arası: Karmaşık
            complexityLevel = "Complex";
            score = 50.0 - ((mccComplexity - 20) * 2);
        } else {
            // 30+ : Çok karmaşık, yeniden yapılandırılmalı
            complexityLevel = "Highly Complex";
            score = Math.max(0, 30.0 - ((mccComplexity - 30) * 1));
        }
        
        // Detaylı açıklama oluştur
        complexityIssues.add(String.format("McCabe Cyclomatic Complexity: %d (%s)", mccComplexity, complexityLevel));
        complexityIssues.add("Risk Levels:");
        complexityIssues.add("1-10: Simple, well-structured code");
        complexityIssues.add("11-20: Moderate complexity, moderate risk");
        complexityIssues.add("21-30: Complex, high risk");
        complexityIssues.add("30+: Highly complex, very high risk, should be refactored");
        
        if (mccComplexity > 10) {
            complexityIssues.add(String.format("Recommendation: Consider refactoring to reduce complexity below 10"));
        }
        
        smellScores.put("Cyclomatic Complexity", Math.max(0, Math.min(100, score)));
        smellDetails.put("Cyclomatic Complexity", complexityIssues);
    }

    private void analyzeNaming(String sourceCode) {
        Pattern variablePattern = Pattern.compile("\\b(?:int|String|boolean|double|float)\\s+(\\w+)\\b");
        Matcher matcher = variablePattern.matcher(sourceCode);
        List<String> namingIssues = new ArrayList<>();
        int totalVariables = 0;
        int badNameCount = 0;

        while (matcher.find()) {
            totalVariables++;
            String variableName = matcher.group(1);
            if (variableName.length() < 3 || !variableName.matches("^[a-z][a-zA-Z0-9]*$")) {
                badNameCount++;
                namingIssues.add("Poor variable name: " + variableName);
            }
        }

        double score = totalVariables > 0 ? (1 - ((double) badNameCount / totalVariables)) * 100 : 100;
        smellScores.put("Naming Conventions", score);
        smellDetails.put("Naming Conventions", namingIssues);
    }

    private void analyzeDataClumps(String sourceCode) {
        Pattern fieldPattern = Pattern.compile("private\\s+\\w+\\s+\\w+;");
        Matcher matcher = fieldPattern.matcher(sourceCode);
        List<String> dataClumpIssues = new ArrayList<>();
        int fieldCount = 0;

        while (matcher.find()) {
            fieldCount++;
        }

        if (fieldCount > 5) {
            dataClumpIssues.add("Class has " + fieldCount + " fields (possible data clump)");
            double score = Math.max(0, 100 - ((fieldCount - 5) * 5));
            smellScores.put("Data Clumps", Math.min(100, score));
        } else {
            dataClumpIssues.add("Class has " + fieldCount + " fields (good practice)");
            smellScores.put("Data Clumps", 100.0);
        }
        
        if (!dataClumpIssues.isEmpty()) {
            smellDetails.put("Data Clumps", dataClumpIssues);
        }
    }

    private void analyzeSwitchStatements(String sourceCode) {
        Pattern switchPattern = Pattern.compile("switch\\s*\\(.*?\\)");
        Matcher matcher = switchPattern.matcher(sourceCode);
        List<String> switchIssues = new ArrayList<>();
        int switchCount = 0;

        while (matcher.find()) {
            switchCount++;
        }

        if (switchCount > 2) {
            switchIssues.add("Found " + switchCount + " switch statements (consider using polymorphism)");
        }

        double score = Math.max(0, 100 - (switchCount * 15));
        smellScores.put("Switch Statements", score);
        smellDetails.put("Switch Statements", switchIssues);
    }

    private int countMethods(String sourceCode) {
        Pattern methodPattern = Pattern.compile("(public|private|protected)\\s+\\w+\\s+\\w+\\s*\\(");
        Matcher matcher = methodPattern.matcher(sourceCode);
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
    }

    private double calculateOverallScore() {
        return smellScores.values().stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
    }
}