package com.codeinspector.codecomparision.service;

import com.codeinspector.codecomparision.dto.CodeComparisonResponse;
import net.sourceforge.pmd.cpd.*;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.*;

@Service
public class CodeComparisonService {

    public CodeComparisonResponse compareCode(String code1, String code2) {
        CodePair codePair = validateInput(code1, code2);
        if (codePair.code1().isBlank() || codePair.code2().isBlank()) {
            throw new IllegalArgumentException("Code snippets cannot be empty");
        }
        return performComparison(codePair.code1(), codePair.code2());
    }

    private record CodePair(String code1, String code2) {}

    private CodePair validateInput(String code1, String code2) {
        return new CodePair(code1.strip(), code2.strip());
    }

    private CodeComparisonResponse performComparison(String code1, String code2) {
        File temp1 = null;
        File temp2 = null;

        try {
            // CPD configuration
            CPDConfiguration config = new CPDConfiguration();
            config.setMinimumTileSize(2);
            config.setLanguage(LanguageFactory.createLanguage("java"));

            CPD cpd = new CPD(config);

            temp1 = createTempFile(code1);
            temp2 = createTempFile(code2);

            cpd.add(temp1);
            cpd.add(temp2);
            cpd.go();

            List<String> duplicatedLines = getDuplicatedLines(cpd);
            int duplicateLineCount = duplicatedLines.size();
            int totalLines = Math.max(countLines(code1), countLines(code2));
            double similarityPercentage = totalLines > 0 ? (duplicateLineCount / (double) totalLines) * 100 : 0.0;

            Map<String, String> code1Metrics = analyzeCodeMetrics(code1);
            Map<String, String> code2Metrics = analyzeCodeMetrics(code2);

            return new CodeComparisonResponse(
                    code1Metrics,
                    code2Metrics,
                    similarityPercentage,
                    String.join("\n", duplicatedLines)
            );

        } catch (Exception e) {
            throw new RuntimeException("Code comparison failed: " + e.getMessage());
        } finally {
            // Clean up temporary files
            if (temp1 != null) {
                temp1.delete();
            }
            if (temp2 != null) {
                temp2.delete();
            }
        }
    }

    private File createTempFile(String content) throws IOException {
        File tempFile = File.createTempFile("code", ".java");
        tempFile.deleteOnExit(); // Ensure the file is deleted when the JVM exits
        try (FileWriter writer = new FileWriter(tempFile)) {
            writer.write(content);
        }
        return tempFile;
    }

    private List<String> getDuplicatedLines(CPD cpd) {
        List<String> duplicatedLines = new ArrayList<>();
        Iterator<Match> matches = cpd.getMatches();
        while (matches.hasNext()) {
            Match match = matches.next();
            for (Mark mark : match) {
                String line = mark.getSourceCodeSlice().strip();
                if (!line.isEmpty() && !line.equals("}") && !line.equals("{")) {
                    duplicatedLines.add(line);
                }
            }
        }
        return duplicatedLines;
    }

    private int countLines(String code) {
        return code.strip().split("\n").length;
    }

    private Map<String, String> analyzeCodeMetrics(String code) {
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
                .filter(line -> line.trim().matches(".*\\b(int|double|String|boolean|char|float)\\b.*;"))
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
