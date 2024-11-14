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
        return new CodePair(code1, code2);
    }

    private CodeComparisonResponse performComparison(String code1, String code2) {
        File temp1 = null;
        File temp2 = null;

        try {
            CPDConfiguration config = new CPDConfiguration();
            config.setMinimumTileSize(2);
            config.setLanguage(LanguageFactory.createLanguage("java"));

            CPD cpd = new CPD(config);

            temp1 = createTempFile(code1);
            temp2 = createTempFile(code2);

            cpd.add(temp1);
            cpd.add(temp2);
            cpd.go();

            StringBuilder matchedLines = new StringBuilder();
            double totalDuplication = 0.0;

            List<String> duplicatedLines = new ArrayList<>();

            // Iterator kullanarak eşleşmeleri almak
            Iterator<Match> matches = cpd.getMatches();
            while (matches.hasNext()) {
                Match match = matches.next();
                for (Mark mark : match) {
                    String line = mark.getSourceCodeSlice().strip();

                    // Boş satırları ve sadece "}" karakterini içeren satırları geçiyoruz
                    if (!line.isEmpty() && !line.equals("}") && !line.equals("{")) {
                        duplicatedLines.add(line);
                    }
                }
            }

            int duplicateLineCount = duplicatedLines.size();
            int totalLines = Math.max(countLines(code1), countLines(code2));

            double similarityPercentage = (duplicateLineCount / (double) totalLines) * 100;

            return new CodeComparisonResponse(similarityPercentage, duplicatedLines.toString());


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

    private int countLines(String code) {
        return code.strip().split("\n").length;
    }
}