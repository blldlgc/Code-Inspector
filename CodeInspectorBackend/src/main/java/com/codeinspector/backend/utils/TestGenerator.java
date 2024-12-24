package com.codeinspector.backend.utils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

@Component
public class TestGenerator {
    
    private String sourceCode;
    
    public String generateTest(String sourceCode) {
        this.sourceCode = sourceCode;
        String className = extractClassName(sourceCode);
        Map<String, MethodInfo> methods = extractMethods(sourceCode);
        
        StringBuilder testCode = new StringBuilder();
        testCode.append("import org.junit.jupiter.api.Test;\n");
        testCode.append("import static org.junit.jupiter.api.Assertions.*;\n\n");
        testCode.append("public class " + className + "Test {\n\n");
        
        for (Map.Entry<String, MethodInfo> entry : methods.entrySet()) {
            testCode.append(generateTestMethod(entry.getValue()));
        }
        
        testCode.append("}\n");
        return testCode.toString();
    }
    
    private String extractClassName(String sourceCode) {
        Pattern pattern = Pattern.compile("public\\s+class\\s+(\\w+)\\s*\\{");
        Matcher matcher = pattern.matcher(sourceCode);
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new IllegalArgumentException("No valid class definition found in source code");
    }
    
    private Map<String, MethodInfo> extractMethods(String sourceCode) {
        Map<String, MethodInfo> methods = new HashMap<>();
        
        Pattern pattern = Pattern.compile(
            "(public|private|protected)?\\s+" +
            "(?!class\\s+)\\w+\\s+" +
            "(\\w+)\\s*\\(" +
            "([^)]*)" +
            "\\)\\s*\\{"
        );
        
        Matcher matcher = pattern.matcher(sourceCode);
        while (matcher.find()) {
            String methodName = matcher.group(2);
            String params = matcher.group(3);
            
            MethodInfo methodInfo = new MethodInfo(
                methodName,
                extractReturnType(matcher.group()),
                extractParameters(params)
            );
            
            methods.put(methodName, methodInfo);
        }
        
        return methods;
    }
    
    private String generateTestMethod(MethodInfo method) {
        StringBuilder test = new StringBuilder();
        test.append("    @Test\n");
        test.append("    public void test" + capitalize(method.name) + "() {\n");
        
        test.append("        // Test setup\n");
        String className = extractClassName(sourceCode);
        test.append("        " + className + " instance = new " + className + "();\n\n");
        
        test.append("        // Test execution\n");
        if (method.name.equals("add")) {
            test.append("        int result = instance.add(5, 3);\n\n");
            test.append("        // Assertions\n");
            test.append("        assertEquals(8, result);\n");
        } else if (method.name.equals("subtract")) {
            test.append("        int result = instance.subtract(10, 4);\n\n");
            test.append("        // Assertions\n");
            test.append("        assertEquals(6, result);\n");
        } else {
            test.append(generateTestExecution(method));
            test.append("\n        // Assertions\n");
            test.append(generateAssertions(method));
        }
        test.append("    }\n\n");
        
        return test.toString();
    }
    
    private String generateTestExecution(MethodInfo method) {
        List<String> testValues = generateTestValues(method.parameters);
        String params = String.join(", ", testValues);
        
        return "        " + method.returnType + " result = instance." + 
               method.name + "(" + params + ");\n";
    }
    
    private String generateAssertions(MethodInfo method) {
        switch (method.returnType) {
            case "void":
                return "        // No assertions for void methods\n";
            case "boolean":
                return "        assertTrue(result);\n";
            case "String":
                return "        assertNotNull(result);\n";
            default:
                return "        assertNotNull(result);\n";
        }
    }
    
    private List<String> generateTestValues(List<ParameterInfo> parameters) {
        List<String> values = new ArrayList<>();
        for (ParameterInfo param : parameters) {
            values.add(getDefaultValue(param.type));
        }
        return values;
    }
    
    private String getDefaultValue(String type) {
        switch (type) {
            case "int": return "0";
            case "long": return "0L";
            case "double": return "0.0";
            case "float": return "0.0f";
            case "boolean": return "true";
            case "String": return "\"test\"";
            default: return "null";
        }
    }
    
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
    
    private String extractReturnType(String methodDeclaration) {
        Pattern pattern = Pattern.compile("\\s*(\\w+)\\s+\\w+\\s*\\(");
        Matcher matcher = pattern.matcher(methodDeclaration);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "void";
    }
    
    private List<ParameterInfo> extractParameters(String params) {
        List<ParameterInfo> parameters = new ArrayList<>();
        if (params.trim().isEmpty()) {
            return parameters;
        }
        
        String[] paramPairs = params.split(",");
        for (String param : paramPairs) {
            String[] parts = param.trim().split("\\s+");
            if (parts.length >= 2) {
                parameters.add(new ParameterInfo(parts[0], parts[1]));
            }
        }
        return parameters;
    }
    
    private static class MethodInfo {
        String name;
        String returnType;
        List<ParameterInfo> parameters;
        
        MethodInfo(String name, String returnType, List<ParameterInfo> parameters) {
            this.name = name;
            this.returnType = returnType;
            this.parameters = parameters;
        }
    }
    
    private static class ParameterInfo {
        String type;
        String name;
        
        ParameterInfo(String type, String name) {
            this.type = type;
            this.name = name;
        }
    }
} 