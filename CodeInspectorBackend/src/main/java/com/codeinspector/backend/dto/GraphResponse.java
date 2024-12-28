package com.codeinspector.backend.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class GraphResponse {
    private GraphNode rootNode;
    private int complexity;
    private String error;
    private List<String> complexityDetails;

    @Data
    public static class GraphNode {
        private String label;
        private int startLine;
        private int endLine;
        private List<GraphNode> children;
        private NodeType type;
        private String code;
        private int complexity;

        public GraphNode(String label, int startLine, int endLine, NodeType type) {
            this.label = label;
            this.startLine = startLine;
            this.endLine = endLine;
            this.type = type;
            this.children = new ArrayList<>();
        }
    }

    public enum NodeType {
        SEQUENCE("Sequence"),
        IF_CONDITION("If Condition"),
        LOOP("Loop"),
        METHOD("Method"),
        SWITCH_CASE("Switch Case");

        private final String displayName;

        NodeType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public GraphResponse(GraphNode rootNode, int complexity) {
        this.rootNode = rootNode;
        this.complexity = complexity;
        this.error = null;
    }

    public GraphResponse(GraphNode rootNode, int complexity, String error) {
        this.rootNode = rootNode;
        this.complexity = complexity;
        this.error = error;
    }

    public GraphResponse(GraphNode rootNode, int complexity, List<String> complexityDetails) {
        this.rootNode = rootNode;
        this.complexity = complexity;
        this.complexityDetails = complexityDetails;
        this.error = null;
    }
} 