package com.codeinspector.backend;
import com.codeinspector.backend.utils.CodeMetricsAnalyzer;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;

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

}
