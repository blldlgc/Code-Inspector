package com.codeinspector.backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

import org.springframework.stereotype.Service;

import com.codeinspector.backend.dto.GraphResponse;
import com.codeinspector.backend.dto.GraphResponse.GraphNode;
import com.codeinspector.backend.dto.GraphResponse.NodeType;

@Service
public class CodeGraphService {

    public GraphResponse analyzeCode(String code) {
        List<String> complexityDetails = new ArrayList<>();
        int complexity = 1;

        try {
            String[] lines = code.split("\n");
            GraphNode rootNode = parseCode(lines, 0, lines.length - 1);
            complexity = calculateComplexity(rootNode);
            collectComplexityDetails(rootNode, complexityDetails);

            return new GraphResponse(rootNode, complexity, complexityDetails);
        } catch (Exception e) {
            return new GraphResponse(null, 0, "Error: " + e.getMessage());
        }
    }

    private GraphNode parseCode(String[] lines, int start, int end) {
        GraphNode currentNode = new GraphNode("root", start, end, NodeType.SEQUENCE);
        StringBuilder codeBuilder = new StringBuilder();
        
        for (int i = start; i <= end; i++) {
            String line = lines[i].trim();
            codeBuilder.append(lines[i]).append("\n");
            
            if (line.matches(".*\\b(if|else if)\\s*\\(.*")) {
                GraphNode ifNode = parseIfBlock(lines, i);
                currentNode.getChildren().add(ifNode);
                parseCode(lines, ifNode.getStartLine() + 1, ifNode.getEndLine() - 1)
                    .getChildren()
                    .forEach(child -> ifNode.getChildren().add(child));
                i = ifNode.getEndLine();
            }
            else if (line.matches(".*\\b(while|for)\\s*\\(.*")) {
                GraphNode loopNode = parseLoopBlock(lines, i);
                currentNode.getChildren().add(loopNode);
                parseCode(lines, loopNode.getStartLine() + 1, loopNode.getEndLine() - 1)
                    .getChildren()
                    .forEach(child -> loopNode.getChildren().add(child));
                i = loopNode.getEndLine();
            }
            else if (line.matches(".*\\bswitch\\s*\\(.*")) {
                GraphNode switchNode = parseSwitchBlock(lines, i);
                currentNode.getChildren().add(switchNode);
                i = switchNode.getEndLine();
            }
            else if (line.matches(".*\\b(public|private|protected)\\s+.*\\(.*\\)\\s*\\{")) {
                GraphNode methodNode = parseMethodBlock(lines, i);
                currentNode.getChildren().add(methodNode);
                parseCode(lines, methodNode.getStartLine() + 1, methodNode.getEndLine() - 1)
                    .getChildren()
                    .forEach(child -> methodNode.getChildren().add(child));
                i = methodNode.getEndLine();
            }
        }
        
        currentNode.setCode(codeBuilder.toString());
        return currentNode;
    }

    private GraphNode parseIfBlock(String[] lines, int start) {
        int end = findBlockEnd(lines, start);
        GraphNode ifNode = new GraphNode("If Statement", start, end, NodeType.IF_CONDITION);
        ifNode.setCode(extractCode(lines, start, end));
        return ifNode;
    }

    private GraphNode parseLoopBlock(String[] lines, int start) {
        int end = findBlockEnd(lines, start);
        GraphNode loopNode = new GraphNode("Loop", start, end, NodeType.LOOP);
        loopNode.setCode(extractCode(lines, start, end));
        return loopNode;
    }

    private GraphNode parseSwitchBlock(String[] lines, int start) {
        int end = findBlockEnd(lines, start);
        GraphNode switchNode = new GraphNode("Switch", start, end, NodeType.SWITCH_CASE);
        switchNode.setCode(extractCode(lines, start, end));
        return switchNode;
    }

    private GraphNode parseMethodBlock(String[] lines, int start) {
        int end = findBlockEnd(lines, start);
        String methodName = extractMethodName(lines[start]);
        GraphNode methodNode = new GraphNode("Method: " + methodName, start, end, NodeType.METHOD);
        methodNode.setCode(extractCode(lines, start, end));
        return methodNode;
    }

    private int findBlockEnd(String[] lines, int start) {
        Stack<Character> brackets = new Stack<>();
        boolean foundOpenBracket = false;
        
        for (int i = start; i < lines.length; i++) {
            String line = lines[i];
            
            for (char c : line.toCharArray()) {
                if (c == '{') {
                    foundOpenBracket = true;
                    brackets.push(c);
                } else if (c == '}') {
                    if (!brackets.isEmpty()) {
                        brackets.pop();
                        if (brackets.isEmpty() && foundOpenBracket) {
                            return i;
                        }
                    }
                }
            }
        }
        
        return lines.length - 1;
    }

    private String extractMethodName(String line) {
        String[] parts = line.split("\\s+");
        for (int i = 0; i < parts.length; i++) {
            if (parts[i].contains("(")) {
                return parts[i].split("\\(")[0];
            }
        }
        return "unknown";
    }

    private String extractCode(String[] lines, int start, int end) {
        StringBuilder code = new StringBuilder();
        for (int i = start; i <= end; i++) {
            code.append(lines[i]).append("\n");
        }
        return code.toString();
    }

    private int calculateComplexity(GraphNode node) {
        int complexity = 1;
        
        switch (node.getType()) {
            case IF_CONDITION:
                complexity++;
                complexity += node.getChildren().stream()
                    .filter(child -> child.getType() == NodeType.IF_CONDITION)
                    .count();
                break;
            case LOOP:
                complexity++;
                complexity += node.getChildren().stream()
                    .filter(child -> child.getType() == NodeType.IF_CONDITION 
                                 || child.getType() == NodeType.LOOP)
                    .count();
                break;
            case SWITCH_CASE:
                complexity += countCases(node.getCode());
                break;
        }
        
        for (GraphNode child : node.getChildren()) {
            complexity += calculateComplexity(child);
        }
        
        node.setComplexity(complexity);
        return complexity;
    }

    private int countCases(String code) {
        int count = 0;
        String[] lines = code.split("\n");
        for (String line : lines) {
            if (line.trim().startsWith("case ")) {
                count++;
            }
        }
        return count;
    }

    private void collectComplexityDetails(GraphNode node, List<String> details) {
        if (node.getComplexity() > 1) {
            details.add(String.format("%s (lines %d-%d): complexity %d",
                node.getLabel(), node.getStartLine() + 1, node.getEndLine() + 1, node.getComplexity()));
        }
        
        for (GraphNode child : node.getChildren()) {
            collectComplexityDetails(child, details);
        }
    }
}