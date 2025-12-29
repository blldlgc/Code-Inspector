package com.codeinspector.backend.service;

import com.codeinspector.backend.graph.CodeGraphResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Graph toughness number (τ(G)) hesaplama servisi.
 * Grafin parçalanmaya karşı dayanıklılığını ölçer.
 * Formül: τ(G) = min{|S| / ω(G−S) : ω(G−S) ≥ 2}
 * 
 * Bu metrik, grafı parçalamak için gereken "bir parça başına düşen düğüm maliyeti"ni ölçer.
 * Düşük toughness → graf kolay parçalanır
 * Yüksek toughness → graf dayanıklıdır
 */
@Service
public class GraphToughnessService {

    private static final Logger logger = LoggerFactory.getLogger(GraphToughnessService.class);
    private static final int MAX_R = 3; // Maksimum r değeri (daha dengeli: r=1,2,3 denenir)
    private static final int MAX_SUBSETS = 100; // Maksimum subset sayısı (heap-safe, daha kapsamlı)
    private static final int NODE_LIMIT_FOR_EXACT = 25; // 25'ten fazla node varsa heuristic kullan

    /**
     * Toughness number (τ(G)) hesaplar.
     * Hazırlanmış graph data kullanır (performans optimizasyonu).
     * Küçük graflar için exact, büyük graflar için heuristic algoritma kullanır.
     * 
     * @param graphData Hazırlanmış graph data (GraphAnalysisHelper.prepareGraphData ile oluşturulmuş)
     * @return Toughness number, veya Double.POSITIVE_INFINITY eğer parçalanamazsa, -1.0 eğer hesaplanamazsa
     */
    public double calculateToughnessNumber(GraphAnalysisHelper.GraphData graphData) {
        Set<String> allNodes = graphData.allNodes;
        List<GraphAnalysisHelper.UndirectedEdge> allEdges = graphData.undirectedEdges;
        List<String> candidates = graphData.sortedCandidates;

        int n = allNodes.size();

        // Edge case: Boş graf veya tek node
        if (n <= 1) {
            logger.debug("Trivial graph (n={}), toughness = POSITIVE_INFINITY", n);
            return Double.POSITIVE_INFINITY;
        }

        // Edge case: İki node
        if (n == 2) {
            logger.debug("Two node graph, toughness = POSITIVE_INFINITY");
            return Double.POSITIVE_INFINITY; // 1 node çıkarınca 1 component kalır, ≥2 değil
        }

        // Edge case: Hiç edge yok
        if (allEdges.isEmpty()) {
            logger.debug("No edges, toughness = POSITIVE_INFINITY");
            return Double.POSITIVE_INFINITY; // Her node ayrı component, ama r=1 çıkarınca component sayısı azalır, ≥2 bulunamaz
        }

        int totalNodes = allNodes.size();
        logger.info("Calculating toughness for {} nodes, {} edges", totalNodes, allEdges.size());

        // Node limiti kontrolü - büyük graflar için heuristic kullan
        if (totalNodes > NODE_LIMIT_FOR_EXACT) {
            logger.info("Graph has {} nodes → using HEURISTIC toughness calculation", totalNodes);
            return calculateApproximateToughness(graphData);
        }

        logger.info("Graph has {} nodes → using EXACT toughness calculation", totalNodes);

        double minToughness = Double.POSITIVE_INFINITY;
        // r değerini sınırla
        int maxR = Math.min(MAX_R, n - 1); // En fazla n-1 node çıkarabiliriz (en az 1 node kalmalı)

        // r = 1'den başlayarak dene (en az 1 node çıkarmalıyız)
        for (int r = 1; r <= maxR; r++) {
            logger.debug("Trying r = {} for toughness", r);

            // r'li subset'ler üret - Limitli kombinasyonlar
            List<Set<String>> subsets = generateLimitedSubsets(candidates, r, MAX_SUBSETS);

            for (Set<String> removedSet : subsets) {
                // Node'ları çıkar
                Set<String> remainingNodes = new HashSet<>(allNodes);
                remainingNodes.removeAll(removedSet);

                // En az 1 node kalmalı
                if (remainingNodes.isEmpty()) {
                    continue;
                }

                // Edge'leri filtrele (sadece remainingNodes içindeki edge'ler)
                List<GraphAnalysisHelper.UndirectedEdge> remainingEdges = allEdges.stream()
                        .filter(e -> remainingNodes.contains(e.u) && remainingNodes.contains(e.v))
                        .collect(Collectors.toList());

                // Connected components sayısını hesapla
                int componentCount = GraphAnalysisHelper.countConnectedComponents(remainingNodes, remainingEdges);

                // Component sayısı ≥ 2 olan durumlara bak
                if (componentCount >= 2) {
                    // ratio = r / componentCount
                    double ratio = (double) r / componentCount;
                    minToughness = Math.min(minToughness, ratio);

                    logger.debug("Found toughness ratio = {} (r: {}, components: {})", 
                            ratio, r, componentCount);
                }
            }
        }

        // Eğer hiç component ≥ 2 bulunamadıysa, graf parçalanamaz
        if (minToughness == Double.POSITIVE_INFINITY) {
            logger.info("Toughness number = POSITIVE_INFINITY (graph cannot be disconnected)");
            return Double.POSITIVE_INFINITY;
        }

        logger.info("Toughness number calculated: {} (EXACT method)", minToughness);
        return minToughness;
    }

    /**
     * Heuristic Toughness fonksiyonu (büyük graflar için).
     */
    private double calculateApproximateToughness(GraphAnalysisHelper.GraphData graphData) {
        Set<String> allNodes = graphData.allNodes;
        List<GraphAnalysisHelper.UndirectedEdge> allEdges = graphData.undirectedEdges;
        Map<String, Integer> degree = graphData.degree;

        // Degree'ye göre sırala (yüksek degree'li node'lar önce)
        List<String> sortedByDegree = allNodes.stream()
                .sorted((a, b) -> Integer.compare(
                        degree.getOrDefault(b, 0),
                        degree.getOrDefault(a, 0)
                ))
                .limit(3) // En fazla 3 node dene
                .collect(java.util.stream.Collectors.toList());

        double best = Double.POSITIVE_INFINITY;
        for (int i = 1; i <= sortedByDegree.size(); i++) {
            Set<String> removed = new HashSet<>(sortedByDegree.subList(0, i));
            Set<String> remaining = new HashSet<>(allNodes);
            remaining.removeAll(removed);

            if (remaining.isEmpty()) {
                continue;
            }

            // Edge'leri filtrele
            List<GraphAnalysisHelper.UndirectedEdge> remainingEdges = allEdges.stream()
                    .filter(e -> remaining.contains(e.u) && remaining.contains(e.v))
                    .collect(java.util.stream.Collectors.toList());

            int componentCount = GraphAnalysisHelper.countConnectedComponents(remaining, remainingEdges);
            if (componentCount >= 2) {
                double ratio = (double) i / componentCount;
                best = Math.min(best, ratio);
                logger.debug("Heuristic toughness ratio = {} (r: {}, components: {})", 
                        ratio, i, componentCount);
            }
        }

        if (best == Double.POSITIVE_INFINITY) {
            logger.info("Toughness number calculated: POSITIVE_INFINITY (HEURISTIC method)");
            return Double.POSITIVE_INFINITY;
        }

        logger.info("Toughness number calculated: {} (HEURISTIC method)", best);
        return best;
    }

    /**
     * Backward compatibility: vertices ve edges'den hesapla.
     * İçeride GraphAnalysisHelper kullanır.
     */
    public double calculateToughnessNumber(
            List<CodeGraphResult.Vertex> vertices,
            List<CodeGraphResult.Edge> edges) {
        
        GraphAnalysisHelper.GraphData graphData = GraphAnalysisHelper.prepareGraphData(vertices, edges);
        return calculateToughnessNumber(graphData);
    }

    /**
     * r'li subset'ler üret - Limitli kombinasyonlar (performans için).
     */
    private List<Set<String>> generateLimitedSubsets(
            List<String> candidates,
            int r,
            int limit) {

        List<Set<String>> subsets = new ArrayList<>();

        if (r == 0) {
            subsets.add(new HashSet<>());
            return subsets;
        }

        if (r > candidates.size()) {
            return subsets;
        }

        // Limitli kombinasyon üretimi
        generateCombinations(candidates, 0, r, new HashSet<>(), subsets, limit);

        logger.debug("Generated {} subsets of size {} (limit: {})",
                subsets.size(), r, limit);
        return subsets;
    }

    /**
     * Kombinasyon üretme (recursive, limitli).
     */
    private void generateCombinations(
            List<String> candidates,
            int start,
            int r,
            Set<String> current,
            List<Set<String>> result,
            int maxSize) {

        if (result.size() >= maxSize) {
            return;
        }

        if (current.size() == r) {
            result.add(new HashSet<>(current));
            return;
        }

        for (int i = start; i < candidates.size() && result.size() < maxSize; i++) {
            current.add(candidates.get(i));
            generateCombinations(candidates, i + 1, r, current, result, maxSize);
            current.remove(candidates.get(i));
        }
    }
}

