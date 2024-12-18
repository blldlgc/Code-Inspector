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
                nodeType + " (" + nodeName + ")",
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
            default:
                return node.getType();
        }
    }
}
