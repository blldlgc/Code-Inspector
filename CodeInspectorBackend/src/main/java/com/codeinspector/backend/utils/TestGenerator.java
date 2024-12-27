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
        
        // Test kurulumu
        test.append("        // Test setup\n");
        String className = extractClassName(sourceCode);
        test.append("        " + className + " instance = new " + className + "();\n\n");
        
        // Test yürütme
        test.append("        // Test execution\n");
        test.append(generateTestExecution(method));
        
        // Assertions
        test.append("\n        // Assertions\n");
        test.append(generateAssertions(method));
        
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
        StringBuilder assertions = new StringBuilder();
        
        switch (method.returnType.toLowerCase()) {
            case "void":
                assertions.append("        // Void metodlar için assertion gerekmez\n");
                break;
            case "boolean":
                assertions.append("        // Boolean dönüş değeri için assertion\n");
                assertions.append("        assertTrue(result);\n");
                break;
            case "int":
            case "long":
            case "short":
            case "byte":
                assertions.append("        // Sayısal dönüş değeri için assertion\n");
                assertions.append("        assertNotNull(result);\n");
                assertions.append("        assertTrue(result >= " + getMinValue(method.returnType) + ");\n");
                assertions.append("        assertTrue(result <= " + getMaxValue(method.returnType) + ");\n");
                break;
            case "double":
            case "float":
                assertions.append("        // Ondalıklı sayı dönüş değeri için assertion\n");
                assertions.append("        assertNotNull(result);\n");
                assertions.append("        assertTrue(!Double.isNaN(result));\n");
                break;
            case "string":
                assertions.append("        // String dönüş değeri için assertion\n");
                assertions.append("        assertNotNull(result);\n");
                assertions.append("        assertTrue(!result.isEmpty());\n");
                break;
            default:
                if (method.returnType.contains("List") || method.returnType.contains("Set") || 
                    method.returnType.contains("Map") || method.returnType.contains("Collection")) {
                    assertions.append("        // Koleksiyon dönüş değeri için assertion\n");
                    assertions.append("        assertNotNull(result);\n");
                } else {
                    assertions.append("        // Özel nesne dönüş değeri için assertion\n");
                    assertions.append("        assertNotNull(result);\n");
                }
        }
        
        return assertions.toString();
    }
    
    private String getMinValue(String type) {
        switch (type.toLowerCase()) {
            case "byte": return "Byte.MIN_VALUE";
            case "short": return "Short.MIN_VALUE";
            case "int": return "Integer.MIN_VALUE";
            case "long": return "Long.MIN_VALUE";
            default: return "0";
        }
    }
    
    private String getMaxValue(String type) {
        switch (type.toLowerCase()) {
            case "byte": return "Byte.MAX_VALUE";
            case "short": return "Short.MAX_VALUE";
            case "int": return "Integer.MAX_VALUE";
            case "long": return "Long.MAX_VALUE";
            default: return "0";
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