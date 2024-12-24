package com.codeinspector.backend.dto;

import java.util.List;

public class TreeSitterResponse {
    private String rootNodeType;
    private List<Node> nodes;
    private String errorMessage;

    public TreeSitterResponse() {}

    public TreeSitterResponse(String rootNodeType, List<Node> nodes, String errorMessage) {
        this.rootNodeType = rootNodeType;
        this.nodes = nodes;
        this.errorMessage = errorMessage;
    }

    public String getRootNodeType() {
        return rootNodeType;
    }

    public void setRootNodeType(String rootNodeType) {
        this.rootNodeType = rootNodeType;
    }

    public List<Node> getNodes() {
        return nodes;
    }

    public void setNodes(List<Node> nodes) {
        this.nodes = nodes;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public static class Node {
        private String type;
        private int startByte;
        private int endByte;
        private int startRow;
        private int startColumn;
        private int endRow;
        private int endColumn;
        private List<Node> children;

        public Node(String type, int startByte, int endByte, int startRow, int startColumn, int endRow, int endColumn, List<Node> children) {
            this.type = type;
            this.startByte = startByte;
            this.endByte = endByte;
            this.startRow = startRow;
            this.startColumn = startColumn;
            this.endRow = endRow;
            this.endColumn = endColumn;
            this.children = children;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public int getStartByte() {
            return startByte;
        }

        public void setStartByte(int startByte) {
            this.startByte = startByte;
        }

        public int getEndByte() {
            return endByte;
        }

        public void setEndByte(int endByte) {
            this.endByte = endByte;
        }

        public int getStartRow() {
            return startRow;
        }

        public void setStartRow(int startRow) {
            this.startRow = startRow;
        }

        public int getStartColumn() {
            return startColumn;
        }

        public void setStartColumn(int startColumn) {
            this.startColumn = startColumn;
        }

        public int getEndRow() {
            return endRow;
        }

        public void setEndRow(int endRow) {
            this.endRow = endRow;
        }

        public int getEndColumn() {
            return endColumn;
        }

        public void setEndColumn(int endColumn) {
            this.endColumn = endColumn;
        }

        public List<Node> getChildren() {
            return children;
        }

        public void setChildren(List<Node> children) {
            this.children = children;
        }
    }
}