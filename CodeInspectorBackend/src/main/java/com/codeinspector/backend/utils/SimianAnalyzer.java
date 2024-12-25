package com.codeinspector.backend.utils;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class SimianAnalyzer {

    private static final String SIMIAN_JAR_PATH = new File(
            "src/main/java/com/codeinspector/backend/libs/simian-4.0.0/simian-4.0.0.jar"
    ).getAbsolutePath();


    public SimianResult analyzeSimilarity(String code1, String code2) {
        File tempFile1 = null;
        File tempFile2 = null;

        try {
            // Kod parçalarını geçici dosyalara yaz
            tempFile1 = createTempFile(code1);
            tempFile2 = createTempFile(code2);

            // Simian'ı çalıştır ve sonuçları oku
            List<String> simianOutput = runSimian(tempFile1.getAbsolutePath(), tempFile2.getAbsolutePath());

            // Simian sonuçlarını işle
            double similarityPercentage = calculateSimilarity(simianOutput);
            List<String> duplicatedLines = extractDuplicatedLines(simianOutput);

            return new SimianResult(similarityPercentage, duplicatedLines);

        } catch (Exception e) {
            throw new RuntimeException("Simian analysis failed: " + e.getMessage());
        } finally {
            // Geçici dosyaları temizle
            if (tempFile1 != null) {
                tempFile1.delete();
            }
            if (tempFile2 != null) {
                tempFile2.delete();
            }
        }
    }

    private File createTempFile(String content) throws IOException {
        File tempFile = File.createTempFile("code", ".java");
        tempFile.deleteOnExit();
        try (FileWriter writer = new FileWriter(tempFile)) {
            writer.write(content);
        }
        return tempFile;
    }

    private List<String> runSimian(String filePath1, String filePath2) throws IOException, InterruptedException {
        ProcessBuilder processBuilder = new ProcessBuilder(
                "java", "-jar", SIMIAN_JAR_PATH, filePath1, filePath2
        );
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();
        List<String> outputLines = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                outputLines.add(line);
                System.out.println("Simian Output: " + line); // Simian çıktısını logla
            }
        }

        process.waitFor();
        return outputLines;
    }


    private double calculateSimilarity(List<String> simianOutput) {
        int duplicateLines = 0;
        int totalLines = 0;

        for (String line : simianOutput) {
            if (line.contains("Found") && line.contains("duplicate lines")) {
                String[] parts = line.split(" ");
                duplicateLines = Integer.parseInt(parts[1]); // Found X duplicate lines
            }
            if (line.contains("Processed a total of") && line.contains("lines")) {
                String[] parts = line.split(" ");
                totalLines = Integer.parseInt(parts[4]); // Processed a total of X lines
            }
        }

        return totalLines > 0 ? (duplicateLines / (double) totalLines) * 100 : 0.0;
    }

    private List<String> extractDuplicatedLines(List<String> simianOutput) {
        List<String> duplicatedLines = new ArrayList<>();
        boolean isDuplicatedBlock = false;

        for (String line : simianOutput) {
            if (line.contains("Duplicate")) {
                isDuplicatedBlock = true;
            } else if (line.isEmpty()) {
                isDuplicatedBlock = false;
            }

            if (isDuplicatedBlock && !line.contains("Duplicate") && !line.isEmpty()) {
                duplicatedLines.add(line.trim());
            }
        }

        return duplicatedLines;
    }

    public static class SimianResult {
        private final double similarityPercentage;
        private final List<String> duplicatedLines;

        public SimianResult(double similarityPercentage, List<String> duplicatedLines) {
            this.similarityPercentage = similarityPercentage;
            this.duplicatedLines = duplicatedLines;
        }

        public double getSimilarityPercentage() {
            return similarityPercentage;
        }

        public List<String> getDuplicatedLines() {
            return duplicatedLines;
        }
    }
}
