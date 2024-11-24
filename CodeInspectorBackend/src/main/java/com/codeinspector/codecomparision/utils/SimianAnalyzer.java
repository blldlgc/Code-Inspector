package com.codeinspector.codecomparision.utils;

import org.springframework.stereotype.Component;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

@Component
public class SimianAnalyzer {

    private static final String SIMIAN_JAR_PATH = new File("src/main/java/com/codeinspector/codecomparision/libs.simian-4.0.0/simian-4.0.jar").getAbsolutePath();


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
            }
        }

        process.waitFor();
        return outputLines;
    }

    private double calculateSimilarity(List<String> simianOutput) {
        int duplicateBlocks = 0;
        int totalBlocks = 0;

        for (String line : simianOutput) {
            if (line.contains("Duplicate")) {
                duplicateBlocks++;
            }
            if (line.contains("block")) {
                totalBlocks++;
            }
        }

        return totalBlocks > 0 ? (duplicateBlocks / (double) totalBlocks) * 100 : 0.0;
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
