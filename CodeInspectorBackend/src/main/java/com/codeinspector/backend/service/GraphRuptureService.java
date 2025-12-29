package com.codeinspector.backend.service;

import com.codeinspector.backend.graph.CodeGraphResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Graph rupture number (r(G)) hesaplama servisi.
 * Grafin en çok ne kadar parçalanabileceğini ölçer, ancak en büyük parçanın boyutunu da hesaba katar.
 * Formül: r(G) = max{ω(G−S) − |S| − m(G−S)}
 * 
 * Scattering'den farkı: En büyük parçanın boyutunu çıkarır (daha sert bir metrik).
 * Heuristic algoritma kullanır (makaledeki Algorithm 1).
 */
@Service
public class GraphRuptureService {

    private static final Logger logger = LoggerFactory.getLogger(GraphRuptureService.class);

    /**
     * Rupture number (r(G)) hesaplar.
     * Hazırlanmış graph data kullanır (performans optimizasyonu).
     * Her zaman heuristic algoritma kullanır (optimal performans için).
     * 
     * @param graphData Hazırlanmış graph data (GraphAnalysisHelper.prepareGraphData ile oluşturulmuş)
     * @return Rupture number, veya -1.0 eğer hesaplanamazsa
     */
    public double calculateRuptureNumber(GraphAnalysisHelper.GraphData graphData) {
        Set<String> allNodes = graphData.allNodes;
        List<GraphAnalysisHelper.UndirectedEdge> allEdges = graphData.undirectedEdges;

        // Edge case: Boş graf
        if (allNodes.isEmpty()) {
            logger.debug("Empty graph, rupture number = -1.0");
            return -1.0;
        }

        // Edge case: Tek node
        if (allNodes.size() == 1) {
            logger.debug("Single node graph, rupture number = -1.0");
            return -1.0;
        }

        // Edge case: İki node
        if (allNodes.size() == 2) {
            logger.debug("Two node graph, rupture number = -1.0");
            return -1.0;
        }

        // Edge case: Hiç edge yok
        if (allEdges.isEmpty()) {
            logger.debug("No edges, rupture number = -1.0");
            return -1.0;
        }

        int totalNodes = allNodes.size();
        logger.info("Calculating rupture for {} nodes, {} edges", totalNodes, allEdges.size());

        // Node limiti kontrolü - büyük graflar için zaten heuristic kullanıyoruz
        // Küçük graflar için de heuristic kullanıyoruz (zaten optimal)
        logger.info("Graph has {} nodes → using HEURISTIC rupture calculation", totalNodes);

        // Heuristic algoritma ile S kümesini oluştur
        Set<String> S = buildRemovalSet(allNodes, allEdges);

        if (S.isEmpty()) {
            logger.debug("No nodes to remove, rupture number = -1.0");
            return -1.0;
        }

        // Rupture değerini hesapla
        double ruptureValue = computeRuptureValue(allNodes, allEdges, S);

        logger.info("Rupture number calculated: {} (removed {} nodes)", ruptureValue, S.size());
        return ruptureValue;
    }

    /**
     * Heuristic algoritma ile çıkarılacak node kümesini oluştur.
     * Algoritma: value(v) = deg(v)³ / (Σ deg(u))² formülü ile en kritik node'ları seçer.
     */
    private Set<String> buildRemovalSet(
            Set<String> allNodes,
            List<GraphAnalysisHelper.UndirectedEdge> allEdges) {

        Set<String> S = new HashSet<>();
        Set<String> remainingNodes = new HashSet<>(allNodes);
        List<GraphAnalysisHelper.UndirectedEdge> remainingEdges = new ArrayList<>(allEdges);

        // Degree > 1 olan node kalmayana kadar devam et
        while (true) {
            // Degree hesapla
            Map<String, Integer> degree = calculateDegrees(remainingNodes, remainingEdges);
            
            // Adjacency list oluştur
            Map<String, Set<String>> adj = GraphAnalysisHelper.buildAdjacency(remainingNodes, remainingEdges);

            // Degree > 1 olan node'ları aday al
            List<String> candidates = new ArrayList<>();
            for (String node : remainingNodes) {
                if (degree.getOrDefault(node, 0) > 1) {
                    candidates.add(node);
                }
            }

            if (candidates.isEmpty()) {
                break;
            }

            // Her aday için heuristic value hesapla
            String bestNode = null;
            double bestValue = -1.0;

            for (String v : candidates) {
                double value = computeHeuristicValue(v, degree, adj);
                if (value > bestValue) {
                    bestValue = value;
                    bestNode = v;
                }
            }

            if (bestNode == null) {
                break;
            }

            // En iyi node'u S'ye ekle ve graf'tan çıkar
            final String nodeToRemove = bestNode; // Lambda için final
            S.add(nodeToRemove);
            remainingNodes.remove(nodeToRemove);
            remainingEdges.removeIf(e -> e.u.equals(nodeToRemove) || e.v.equals(nodeToRemove));

            logger.debug("Removed node: {} (heuristic value: {})", nodeToRemove, bestValue);
        }

        return S;
    }

    /**
     * Heuristic value hesaplama (makaledeki formül).
     * value(v) = deg(v)³ / (Σ deg(u))²
     * 
     * "Kendisi güçlü ama komşuları zayıf olan node'u seç" mantığı.
     */
    private double computeHeuristicValue(
            String v,
            Map<String, Integer> degree,
            Map<String, Set<String>> adj) {

        int degV = degree.getOrDefault(v, 0);
        if (degV <= 1) {
            return -1.0;
        }

        // Komşularının toplam degree'si
        int neighborDegreeSum = 0;
        Set<String> neighbors = adj.getOrDefault(v, Collections.emptySet());
        for (String neighbor : neighbors) {
            neighborDegreeSum += degree.getOrDefault(neighbor, 0);
        }

        if (neighborDegreeSum == 0) {
            return -1.0;
        }

        // value(v) = deg(v)³ / (Σ deg(u))²
        double value = Math.pow(degV, 3) / Math.pow(neighborDegreeSum, 2);
        return value;
    }

    /**
     * Degree hesaplama (undirected graph için).
     */
    private Map<String, Integer> calculateDegrees(
            Set<String> nodes,
            List<GraphAnalysisHelper.UndirectedEdge> edges) {

        Map<String, Integer> degree = new HashMap<>();
        for (String node : nodes) {
            degree.put(node, 0);
        }

        for (GraphAnalysisHelper.UndirectedEdge e : edges) {
            degree.put(e.u, degree.get(e.u) + 1);
            degree.put(e.v, degree.get(e.v) + 1);
        }

        return degree;
    }

    /**
     * Rupture değerini hesapla: r(G) = ω(G−S) − |S| − m(G−S)
     * 
     * @param allNodes Tüm node'lar
     * @param allEdges Tüm edge'ler
     * @param S Çıkarılan node kümesi
     * @return Rupture değeri
     */
    private double computeRuptureValue(
            Set<String> allNodes,
            List<GraphAnalysisHelper.UndirectedEdge> allEdges,
            Set<String> S) {

        // G - S: Node'ları çıkar
        Set<String> remainingNodes = new HashSet<>(allNodes);
        remainingNodes.removeAll(S);

        if (remainingNodes.size() < 2) {
            logger.debug("Less than 2 nodes remaining, rupture = -1.0");
            return -1.0;
        }

        // Edge'leri filtrele (sadece remainingNodes içindeki edge'ler)
        List<GraphAnalysisHelper.UndirectedEdge> remainingEdges = new ArrayList<>();
        for (GraphAnalysisHelper.UndirectedEdge e : allEdges) {
            if (remainingNodes.contains(e.u) && remainingNodes.contains(e.v)) {
                remainingEdges.add(e);
            }
        }

        // Connected components listesini al
        List<Set<String>> components = GraphAnalysisHelper.getConnectedComponents(remainingNodes, remainingEdges);

        if (components.size() < 2) {
            logger.debug("Less than 2 components, rupture = -1.0");
            return -1.0;
        }

        // ω(G−S): Component sayısı
        int omega = components.size();

        // m(G−S): En büyük component'in node sayısı
        int maxComponentSize = 0;
        for (Set<String> component : components) {
            maxComponentSize = Math.max(maxComponentSize, component.size());
        }

        // r(G) = ω(G−S) − |S| − m(G−S)
        double rupture = omega - S.size() - maxComponentSize;

        logger.debug("Rupture calculation: omega={}, |S|={}, maxComponentSize={}, rupture={}",
                omega, S.size(), maxComponentSize, rupture);

        return rupture;
    }

    /**
     * Backward compatibility: vertices ve edges'den hesapla.
     * İçeride GraphAnalysisHelper kullanır.
     */
    public double calculateRuptureNumber(
            List<CodeGraphResult.Vertex> vertices,
            List<CodeGraphResult.Edge> edges) {
        
        GraphAnalysisHelper.GraphData graphData = GraphAnalysisHelper.prepareGraphData(vertices, edges);
        return calculateRuptureNumber(graphData);
    }
}

