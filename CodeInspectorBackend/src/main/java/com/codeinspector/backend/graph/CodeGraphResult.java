package com.codeinspector.backend.graph;

import java.util.ArrayList;
import java.util.HashMap;
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
        private int connectivityNumber = -1; // -1 = hesaplanmadı
        private double scatteringNumber = -1.0; // -1.0 = hesaplanmadı
        private double ruptureNumber = -1.0; // -1.0 = hesaplanmadı
        private double integrityNumber = -1.0; // -1.0 = hesaplanmadı
        private double toughnessNumber = -1.0; // -1.0 = hesaplanmadı, POSITIVE_INFINITY = parçalanamaz
        private int dominationNumber = -1; // -1 = hesaplanmadı
        private int twoVertexCoverNumber = -1; // -1 = hesaplanmadı
        private List<String> twoVertexCoverNodes = new ArrayList<>(); // Seçilen node'lar
        private Map<Integer, Integer> degreeDistribution = new HashMap<>(); // degree -> node count
        
        // Calculation method bilgileri (EXACT / HEURISTIC)
        private String scatteringCalculationMethod; // EXACT / HEURISTIC
        private String ruptureCalculationMethod; // EXACT / HEURISTIC
        private String integrityCalculationMethod; // EXACT / HEURISTIC
        private String toughnessCalculationMethod; // EXACT / HEURISTIC
        private String connectivityCalculationMethod; // EXACT / HEURISTIC

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

        public int getConnectivityNumber() {
            return connectivityNumber;
        }

        public void setConnectivityNumber(int connectivityNumber) {
            this.connectivityNumber = connectivityNumber;
        }

        public double getScatteringNumber() {
            return scatteringNumber;
        }

        public void setScatteringNumber(double scatteringNumber) {
            this.scatteringNumber = scatteringNumber;
        }

        public double getRuptureNumber() {
            return ruptureNumber;
        }

        public void setRuptureNumber(double ruptureNumber) {
            this.ruptureNumber = ruptureNumber;
        }

        public double getIntegrityNumber() {
            return integrityNumber;
        }

        public void setIntegrityNumber(double integrityNumber) {
            this.integrityNumber = integrityNumber;
        }

        public double getToughnessNumber() {
            return toughnessNumber;
        }

        public void setToughnessNumber(double toughnessNumber) {
            this.toughnessNumber = toughnessNumber;
        }

        public int getDominationNumber() {
            return dominationNumber;
        }

        public void setDominationNumber(int dominationNumber) {
            this.dominationNumber = dominationNumber;
        }

        public int getTwoVertexCoverNumber() {
            return twoVertexCoverNumber;
        }

        public void setTwoVertexCoverNumber(int twoVertexCoverNumber) {
            this.twoVertexCoverNumber = twoVertexCoverNumber;
        }

        public List<String> getTwoVertexCoverNodes() {
            return twoVertexCoverNodes;
        }

        public void setTwoVertexCoverNodes(List<String> twoVertexCoverNodes) {
            this.twoVertexCoverNodes = twoVertexCoverNodes;
        }

        public Map<Integer, Integer> getDegreeDistribution() {
            return degreeDistribution;
        }

        public void setDegreeDistribution(Map<Integer, Integer> degreeDistribution) {
            this.degreeDistribution = degreeDistribution;
        }

        public String getScatteringCalculationMethod() {
            return scatteringCalculationMethod;
        }

        public void setScatteringCalculationMethod(String scatteringCalculationMethod) {
            this.scatteringCalculationMethod = scatteringCalculationMethod;
        }

        public String getRuptureCalculationMethod() {
            return ruptureCalculationMethod;
        }

        public void setRuptureCalculationMethod(String ruptureCalculationMethod) {
            this.ruptureCalculationMethod = ruptureCalculationMethod;
        }

        public String getIntegrityCalculationMethod() {
            return integrityCalculationMethod;
        }

        public void setIntegrityCalculationMethod(String integrityCalculationMethod) {
            this.integrityCalculationMethod = integrityCalculationMethod;
        }

        public String getToughnessCalculationMethod() {
            return toughnessCalculationMethod;
        }

        public void setToughnessCalculationMethod(String toughnessCalculationMethod) {
            this.toughnessCalculationMethod = toughnessCalculationMethod;
        }

        public String getConnectivityCalculationMethod() {
            return connectivityCalculationMethod;
        }

        public void setConnectivityCalculationMethod(String connectivityCalculationMethod) {
            this.connectivityCalculationMethod = connectivityCalculationMethod;
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




