package com.codeinspector.codecomparison.service;

import com.codeinspector.codecomparison.dto.TreeSitterRequest;
import com.codeinspector.codecomparison.dto.TreeSitterResponse;
import org.springframework.stereotype.Service;
import org.treesitter.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TreeSitterService {

    public TreeSitterResponse analyzeCode(String code) {
        TSParser parser = new TSParser();

        try {
            TSLanguage javaLanguage = new TreeSitterJava();
            parser.setLanguage(javaLanguage);

            TSTree tree = parser.parseString(null, code);
            TSNode rootNode = tree.getRootNode();

            if (rootNode == null) {
                throw new IllegalStateException("Root node is null");
            }

            List<TreeSitterResponse.Node> nodes = new ArrayList<>();
            Map<String, List<String>> relationships = new HashMap<>();

            collectGraph(rootNode, nodes, relationships, code);

            // İlişkiler ve node'ları döndür
            return new TreeSitterResponse(rootNode.getType(), nodes, relationships, null);

        } catch (Exception e) {
            return new TreeSitterResponse(null, null, null, "Error analyzing code: " + e.getMessage());
        }
    }

    private void collectGraph(TSNode node, List<TreeSitterResponse.Node> nodes, Map<String, List<String>> relationships, String code) {
        if (node == null) return;

        String nodeType = getNodeType(node);
        String nodeName = getNodeName(node, code);

        if (nodeType.equals("Class") || nodeType.equals("Method")) {
            TreeSitterResponse.Node currentNode = new TreeSitterResponse.Node(
                    nodeType + " (" + nodeName + ")",
                    node.getStartByte(),
                    node.getEndByte(),
                    node.getStartPoint().getRow(),
                    node.getStartPoint().getColumn(),
                    node.getEndPoint().getRow(),
                    node.getEndPoint().getColumn(),
                    new ArrayList<>()
            );
            nodes.add(currentNode);

            // Metot çağrıları ve ilişkileri ekle
            if (nodeType.equals("Method")) {
                for (int i = 0; i < node.getChildCount(); i++) {
                    TSNode childNode = node.getChild(i);

                    if (childNode.getType().equals("method_invocation")) {
                        extractCalledMethod(childNode, nodeName, relationships, code);
                    }
                }
            }
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            collectGraph(node.getChild(i), nodes, relationships, code);
        }
    }

    private void extractCalledMethod(TSNode methodInvocationNode, String nodeName, Map<String, List<String>> relationships, String code) {
        for (int j = 0; j < methodInvocationNode.getChildCount(); j++) {
            TSNode grandChild = methodInvocationNode.getChild(j);
            if (grandChild.getType().equals("identifier")) {
                String calledMethodName = getNodeText(code, grandChild);
                if (calledMethodName != null && !calledMethodName.isEmpty()) {
                    relationships.computeIfAbsent(nodeName, k -> new ArrayList<>()).add(calledMethodName);
                }
            }
        }
    }

    private String getNodeName(TSNode node, String code) {
        if (node == null) return "Unnamed";

        String nodeType = node.getType();
        if (nodeType.equals("class_declaration") || nodeType.equals("method_declaration")) {
            TSNode nameNode = node.getChildByFieldName("name");
            if (nameNode != null) {
                return getNodeText(code, nameNode);
            }
        }
        return "Unnamed";
    }

    private String getNodeText(String code, TSNode node) {
        if (node == null) return "";
        int startByte = node.getStartByte();
        int endByte = node.getEndByte();
        return code.substring(startByte, endByte);
    }

    private String getNodeType(TSNode node) {
        switch (node.getType()) {
            case "class_declaration":
                return "Class";
            case "method_declaration":
                return "Method";
            case "method_invocation":
                return "Method Call";
            default:
                return node.getType();
        }
    }
}
