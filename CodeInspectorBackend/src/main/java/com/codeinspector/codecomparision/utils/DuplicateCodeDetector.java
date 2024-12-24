package com.codeinspector.codecomparision.utils;

import net.sourceforge.pmd.cpd.*;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Component
public class DuplicateCodeDetector {

    public List<String> detectDuplicates(String code1, String code2) {
        try {
            File temp1 = createTempFile(code1);
            File temp2 = createTempFile(code2);

            CPDConfiguration config = new CPDConfiguration();
            config.setMinimumTileSize(2);
            config.setLanguage(LanguageFactory.createLanguage("java"));

            CPD cpd = new CPD(config);
            cpd.add(temp1);
            cpd.add(temp2);
            cpd.go();

            return getDuplicatedLines(cpd);

        } catch (Exception e) {
            throw new RuntimeException("Duplicate detection failed: " + e.getMessage());
        }
    }

    public double calculateSimilarityPercentage(String code1, String code2, List<String> duplicatedLines) {
        int duplicateLineCount = duplicatedLines.size();
        int totalLines = Math.max(countLines(code1), countLines(code2));
        return totalLines > 0 ? (duplicateLineCount / (double) totalLines) * 100 : 0.0;
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

    private File createTempFile(String content) throws Exception {
        File tempFile = File.createTempFile("code", ".java");
        tempFile.deleteOnExit();
        try (FileWriter writer = new FileWriter(tempFile)) {
            writer.write(content);
        }
        return tempFile;
    }

    private int countLines(String code) {
        return code.strip().split("\n").length;
    }
}
