package com.codeinspector.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.treesitter.TSLanguage;
import org.treesitter.TSNode;
import org.treesitter.TSParser;
import org.treesitter.TSTree;
import org.treesitter.TreeSitterJava;

import com.codeinspector.backend.dto.TreeSitterResponse;

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
                return new TreeSitterResponse(null, null, "Root node is null");
            }

            List<TreeSitterResponse.Node> nodes = new ArrayList<>();
            collectGraph(rootNode, nodes, code);

            return new TreeSitterResponse(rootNode.getType(), nodes, null);

        } catch (Exception e) {
            return new TreeSitterResponse(null, null, "Error analyzing code: " + e.getMessage());
        }
    }

    private void collectGraph(TSNode node, List<TreeSitterResponse.Node> nodes, String code) {
        if (node == null) return;

        String nodeType = getNodeType(node);
        String nodeName = getNodeName(node, code);

        List<TreeSitterResponse.Node> childNodes = new ArrayList<>();

        TreeSitterResponse.Node currentNode = new TreeSitterResponse.Node(
                nodeName.isEmpty() ? nodeType : nodeType + " (" + nodeName + ")",
                node.getStartByte(),
                node.getEndByte(),
                node.getStartPoint().getRow(),
                node.getStartPoint().getColumn(),
                node.getEndPoint().getRow(),
                node.getEndPoint().getColumn(),
                childNodes
        );

        for (int i = 0; i < node.getChildCount(); i++) {
            collectGraph(node.getChild(i), childNodes, code);
        }

        nodes.add(currentNode);
    }

    private String getNodeName(TSNode node, String code) {
        if (node == null) return "";

        String nodeType = node.getType();
        switch (nodeType) {
            case "class_declaration":
            case "method_declaration":
            case "constructor_declaration":
                TSNode nameNode = node.getChildByFieldName("name");
                if (nameNode != null) {
                    return getNodeText(code, nameNode);
                }
                break;
            
            case "variable_declaration":
            case "local_variable_declaration":
            case "field_declaration":
                TSNode declarator = node.getChildByFieldName("declarator");
                if (declarator != null) {
                    TSNode varName = declarator.getChildByFieldName("name");
                    if (varName != null) {
                        return getNodeText(code, varName);
                    }
                }
                break;
            
            case "formal_parameter":
                TSNode paramName = node.getChildByFieldName("name");
                if (paramName != null) {
                    return getNodeText(code, paramName);
                }
                break;
            
            case "import_declaration":
                return getNodeText(code, node);
            
            
            case "method_invocation":
                TSNode methodName = node.getChildByFieldName("name");
                if (methodName != null) {
                    return getNodeText(code, methodName);
                }
                break;
            
            case "package_declaration":
                return getNodeText(code, node);
            
            case "variable_declarator":
                TSNode varNameNode = node.getChildByFieldName("name");
                if (varNameNode != null) {
                    String varName = getNodeText(code, varNameNode);
                    TSNode typeNode = node.getParent().getChildByFieldName("type");
                    if (typeNode != null) {
                        String typeName = getNodeText(code, typeNode);
                        return "(" + typeName + " " + varName + ")";
                    }
                    return "(" + varName + ")";
                }
                break;

            case "type_identifier":
                return "(" + getNodeText(code, node) + ")";
            
            case "primitive_type":
                return "(" + getNodeText(code, node) + ")";
        }
        return "";
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
            default:
                return node.getType();
        }
    }
}


