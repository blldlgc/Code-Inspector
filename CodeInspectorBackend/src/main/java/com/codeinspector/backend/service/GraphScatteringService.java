package com.codeinspector.backend.service;

import com.codeinspector.backend.graph.CodeGraphResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Graph scattering number (s(G)) hesaplama servisi.
 * Grafin en çok ne kadar parçalanabileceğini ölçer.
 * Formül: s(G) = max{ω(G−S) − |S|}
 */
@Service
public class GraphScatteringService {

    private static final Logger logger = LoggerFactory.getLogger(GraphScatteringService.class);
    private static final int MAX_R = 5; // Maksimum deneme sayısı (güvenlik sınırı)

    /**
     * Scattering number (s(G)) hesaplar.
     * Hazırlanmış graph data kullanır (performans optimizasyonu).
     * 
     * @param graphData Hazırlanmış graph data (GraphAnalysisHelper.prepareGraphData ile oluşturulmuş)
     * @return Scattering number, veya -1.0 eğer hesaplanamazsa
     */
    public double calculateScatteringNumber(GraphAnalysisHelper.GraphData graphData) {
        Set<String> allNodes = graphData.allNodes;
        List<GraphAnalysisHelper.UndirectedEdge> undirectedEdges = graphData.undirectedEdges;
        List<String> candidates = graphData.sortedCandidates;

        // Edge case: Boş graf
        if (allNodes.isEmpty()) {
            logger.debug("Empty graph, scattering number = 0.0");
            return 0.0;
        }

        // Edge case: Tek node
        if (allNodes.size() == 1) {
            logger.debug("Single node graph, scattering number = 0.0");
            return 0.0;
        }

        // Edge case: İki node
        if (allNodes.size() == 2) {
            logger.debug("Two node graph, scattering number = 0.0");
            return 0.0; // Çıkarırsak 1 node kalır, component sayısı 1, scattering = 1-1 = 0
        }

        // Edge case: Hiç edge yok
        if (undirectedEdges.isEmpty()) {
            logger.debug("No edges, scattering number = 0.0");
            return 0.0;
        }

        logger.info("Calculating scattering for {} nodes, {} edges", allNodes.size(), undirectedEdges.size());

        double maxScattering = 0.0;
        int maxR = Math.min(MAX_R, allNodes.size() - 2); // En az 2 node kalmalı

        // r = 1'den başlayarak dene
        for (int r = 1; r <= maxR; r++) {
            logger.debug("Trying r = {} for scattering", r);

            // r'li subset'ler üret - TÜM kombinasyonları dene
            List<Set<String>> subsets = generateAllSubsets(candidates, r);

            for (Set<String> removedSet : subsets) {
                // Node'ları çıkar
                Set<String> remainingNodes = new HashSet<>(allNodes);
                remainingNodes.removeAll(removedSet);

                // En az 2 node kalmalı
                if (remainingNodes.size() < 2) {
                    continue;
                }

                // Edge'leri filtrele (sadece remainingNodes içindeki edge'ler)
                List<GraphAnalysisHelper.UndirectedEdge> remainingEdges = undirectedEdges.stream()
                        .filter(e -> remainingNodes.contains(e.u) && remainingNodes.contains(e.v))
                        .collect(Collectors.toList());

                // Connected components sayısını hesapla
                int componentCount = GraphAnalysisHelper.countConnectedComponents(remainingNodes, remainingEdges);

                // Scattering hesapla: componentCount - r
                if (componentCount >= 2) {
                    double scattering = componentCount - r;
                    maxScattering = Math.max(maxScattering, scattering);
                    
                    logger.debug("Found scattering = {} (components: {}, removed: {})", 
                            scattering, componentCount, removedSet.size());
                }
            }
        }

        logger.info("Scattering number calculated: {}", maxScattering);
        return maxScattering;
    }

    /**
     * Backward compatibility: vertices ve edges'den hesapla.
     * İçeride GraphAnalysisHelper kullanır.
     */
    public double calculateScatteringNumber(
            List<CodeGraphResult.Vertex> vertices,
            List<CodeGraphResult.Edge> edges) {
        
        GraphAnalysisHelper.GraphData graphData = GraphAnalysisHelper.prepareGraphData(vertices, edges);
        return calculateScatteringNumber(graphData);
    }

    /**
     * r'li subset'ler üret - TÜM kombinasyonları dene.
     */
    private List<Set<String>> generateAllSubsets(
            List<String> candidates,
            int r) {

        List<Set<String>> subsets = new ArrayList<>();

        if (r == 0) {
            subsets.add(new HashSet<>());
            return subsets;
        }

        if (r > candidates.size()) {
            return subsets;
        }

        // Kombinasyon sayısını hesapla
        long totalCombinations = binomialCoefficient(candidates.size(), r);

        // Performans uyarısı (çok fazla kombinasyon varsa)
        if (totalCombinations > 10000) {
            logger.warn("Large number of combinations ({}) for r={} with {} nodes. This may take time.",
                    totalCombinations, r, candidates.size());
        }

        // TÜM kombinasyonları üret (limit yok)
        generateCombinations(candidates, 0, r, new HashSet<>(), subsets, Integer.MAX_VALUE);

        logger.debug("Generated {} subsets of size {} (expected: {})",
                subsets.size(), r, totalCombinations);
        return subsets;
    }

    /**
     * Binomial coefficient (kombinasyon sayısı) hesaplama: C(n, k) = n! / (k! * (n-k)!)
     */
    private long binomialCoefficient(int n, int k) {
        if (k > n - k) {
            k = n - k; // Optimize: C(n, k) = C(n, n-k)
        }

        long result = 1;
        for (int i = 0; i < k; i++) {
            result = result * (n - i) / (i + 1);
        }
        return result;
    }

    /**
     * Kombinasyon üretme (recursive).
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


