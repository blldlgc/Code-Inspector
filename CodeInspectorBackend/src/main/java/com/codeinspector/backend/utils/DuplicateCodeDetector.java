package com.codeinspector.backend.utils;

import java.io.File;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import net.sourceforge.pmd.cpd.CPD;
import net.sourceforge.pmd.cpd.CPDConfiguration;
import net.sourceforge.pmd.cpd.LanguageFactory;
import net.sourceforge.pmd.cpd.Match;

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
        List<String> code1LinesList = getNonEmptyLines(code1);
        List<String> code2LinesList = getNonEmptyLines(code2);
        
        List<String> uniqueDuplicatedLines = new ArrayList<>(new HashSet<>(duplicatedLines));
        int duplicateLineCount = uniqueDuplicatedLines.size();
        
        int totalUniqueLines = Math.max(code1LinesList.size(), code2LinesList.size());
        
        if (totalUniqueLines == 0) return 0.0;
        return Math.min(100.0, (duplicateLineCount * 100.0) / totalUniqueLines);
    }

    private List<String> getDuplicatedLines(CPD cpd) {
        List<String> duplicatedLines = new ArrayList<>();
        Iterator<Match> matches = cpd.getMatches();
        while (matches.hasNext()) {
            Match match = matches.next();
            String duplicateCode = match.getSourceCodeSlice().strip();
            String[] lines = duplicateCode.split("\n");
            for (String line : lines) {
                line = line.strip();
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

    private List<String> getNonEmptyLines(String code) {
        return Arrays.stream(code.split("\n"))
                .map(String::strip)
                .filter(line -> !line.isEmpty() && !line.equals("}") && !line.equals("{"))
                .collect(Collectors.toList());
    }
}
