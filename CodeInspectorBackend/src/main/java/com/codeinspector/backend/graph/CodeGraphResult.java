package com.codeinspector.backend.graph;

import java.util.List;
import java.util.Map;

/**
 * Basit proje kod grafı sonucu DTO'su.
 * Frontend için düğümler, kenarlar ve bazı özet metrikler içerir.
 */
public class CodeGraphResult {

    public static class Vertex {
        private String id;
        private String label;
        private String type; // class | method
        private Map<String, Object> metrics;

        public Vertex() {
        }

        public Vertex(String id, String label, String type, Map<String, Object> metrics) {
            this.id = id;
            this.label = label;
            this.type = type;
            this.metrics = metrics;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Map<String, Object> getMetrics() {
            return metrics;
        }

        public void setMetrics(Map<String, Object> metrics) {
            this.metrics = metrics;
        }
    }

    public static class Edge {
        private String source;
        private String target;
        // type: "depends" | "has" | "calls"
        // - depends: Sınıf-sınıf bağımlılığı
        // - has: Sınıf-metot ilişkisi  
        // - calls: Metot-metot çağrısı
        private String type;

        public Edge() {
        }

        public Edge(String source, String target, String type) {
            this.source = source;
            this.target = target;
            this.type = type;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public String getTarget() {
            return target;
        }

        public void setTarget(String target) {
            this.target = target;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }
    }

    public static class GraphMetrics {
        private int totalNodes;
        private int totalEdges;
        private double avgDegree;
        private int maxDegree;

        public int getTotalNodes() {
            return totalNodes;
        }

        public void setTotalNodes(int totalNodes) {
            this.totalNodes = totalNodes;
        }

        public int getTotalEdges() {
            return totalEdges;
        }

        public void setTotalEdges(int totalEdges) {
            this.totalEdges = totalEdges;
        }

        public double getAvgDegree() {
            return avgDegree;
        }

        public void setAvgDegree(double avgDegree) {
            this.avgDegree = avgDegree;
        }

        public int getMaxDegree() {
            return maxDegree;
        }

        public void setMaxDegree(int maxDegree) {
            this.maxDegree = maxDegree;
        }
    }

    private List<Vertex> vertices;
    private List<Edge> edges;
    private GraphMetrics metrics;

    public List<Vertex> getVertices() {
        return vertices;
    }

    public void setVertices(List<Vertex> vertices) {
        this.vertices = vertices;
    }

    public List<Edge> getEdges() {
        return edges;
    }

    public void setEdges(List<Edge> edges) {
        this.edges = edges;
    }

    public GraphMetrics getMetrics() {
        return metrics;
    }

    public void setMetrics(GraphMetrics metrics) {
        this.metrics = metrics;
    }
}




