package com.codeinspector.backend;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.codeinspector.backend.utils.CodeMetricsAnalyzer;

public class CodeMetricsAnalyzerTest {

    private final String code = """
        // This is a sample Java code for testing
        public class SampleClass {

        // Variable declarations
        private int count;
        private String name;

        // Constructor
        public SampleClass(String name) {
            this.name = name;
            this.count = 0;
        }

        // A sample method
        public void increment() {
            // Increment the count
            count++;
        }

        // Another method with loops and conditions
        public void analyze(int[] numbers) {
            for (int num : numbers) {
                if (num % 2 == 0) {
                    System.out.println("Even number: " + num);
                } else {
                    System.out.println("Odd number: " + num);
                }
            }
        }

        // Method calling another method
        public void process() {
            increment();
        }
    }
    """;

    private final CodeMetricsAnalyzer analyzer = new CodeMetricsAnalyzer();

    @Test
    public void testLinesOfCode() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        assertEquals("35", metrics.get("Lines of Code"), "Lines of Code mismatch");
    }

    @Test
    public void testNumberOfMethods() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        assertEquals("4", metrics.get("Number of Methods"), "Number of Methods mismatch");
    }

    @Test
    public void testNumberOfClasses() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        assertEquals("1", metrics.get("Number of Classes"), "Number of Classes mismatch");
    }

    @Test
    public void testNumberOfLoops() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        assertEquals("2", metrics.get("Number of Loops"), "Number of Loops mismatch");
    }

    @Test
    public void testNumberOfComments() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        assertEquals("7", metrics.get("Number of Comments"), "Number of Comments mismatch");
    }

    @Test
    public void testCyclomaticComplexity() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        assertEquals("5", metrics.get("Cyclomatic Complexity"), "Cyclomatic Complexity mismatch");
    }

    @Test
    public void testVariableDeclarations() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        assertEquals("2", metrics.get("Variable Declarations"), "Variable Declarations mismatch");
    }

    @Test
    public void testFunctionCalls() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        assertEquals("3", metrics.get("Function Calls"), "Function Calls mismatch");
    }

    @Test
    public void testMaxLineLength() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        assertEquals("58", metrics.get("Max Line Length"), "Max Line Length mismatch");
    }

    @Test
    public void testEmptyLines() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        assertEquals("5", metrics.get("Empty Lines"), "Empty Lines mismatch");
    }

    @Test
    public void testHalsteadMetrics() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        
        // Halstead metriklerinin varlığını kontrol et
        assertNotNull(metrics.get("Halstead Program Length"), "Halstead Program Length eksik");
        assertNotNull(metrics.get("Halstead Vocabulary"), "Halstead Vocabulary eksik");
        assertNotNull(metrics.get("Halstead Volume"), "Halstead Volume eksik");
        assertNotNull(metrics.get("Halstead Difficulty"), "Halstead Difficulty eksik");
        assertNotNull(metrics.get("Halstead Effort"), "Halstead Effort eksik");
        assertNotNull(metrics.get("Halstead Time"), "Halstead Time eksik");
        assertNotNull(metrics.get("Halstead Bugs"), "Halstead Bugs eksik");
        
        // Değerlerin sayısal format kontrolü - daha esnek bir regex kullanıyoruz
        String volumeStr = metrics.get("Halstead Volume").replace(",", ".");
        String difficultyStr = metrics.get("Halstead Difficulty").replace(",", ".");
        
        // Sayısal değer kontrolü
        assertTrue(isNumeric(volumeStr), "Halstead Volume sayısal değer değil");
        assertTrue(isNumeric(difficultyStr), "Halstead Difficulty sayısal değer değil");
    }

    // Yardımcı metod - sayısal değer kontrolü için
    private boolean isNumeric(String str) {
        if (str == null) return false;
        try {
            Double.parseDouble(str);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    @Test
    public void testMaintainabilityIndex() {
        Map<String, String> metrics = analyzer.analyzeMetrics(code);
        
        // Maintainability Index kontrolü
        assertNotNull(metrics.get("Maintainability Index"), "Maintainability Index eksik");
        
        // Virgül yerine nokta kullanarak sayıyı parse et
        String maintainabilityStr = metrics.get("Maintainability Index").replace(",", ".");
        double maintainabilityIndex = Double.parseDouble(maintainabilityStr);
        
        // MI değer aralığı kontrolü (0-100 arası)
        assertTrue(maintainabilityIndex >= 0 && maintainabilityIndex <= 100, 
            "Maintainability Index 0-100 aralığında olmalı");
    }






}
