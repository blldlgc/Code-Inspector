package com.codeinspector.codecomparison.dto;

import java.util.List;

public class TreeSitterResponse {
    private String rootNodeType;
    private List<TreeNode> nodes;
    private String errorMessage;

    public TreeSitterResponse() {}

    public TreeSitterResponse(String rootNodeType, List<TreeNode> nodes, String errorMessage) {
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

    public List<TreeNode> getNodes() {
        return nodes;
    }

    public void setNodes(List<TreeNode> nodes) {
        this.nodes = nodes;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public static class TreeNode {
        private String type;
        private int startByte;
        private int endByte;
        private List<TreeNode> children;

        public TreeNode(String type, int startByte, int endByte, List<TreeNode> children) {
            this.type = type;
            this.startByte = startByte;
            this.endByte = endByte;
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

        public List<TreeNode> getChildren() {
            return children;
        }

        public void setChildren(List<TreeNode> children) {
            this.children = children;
        }
    }
}
