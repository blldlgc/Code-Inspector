package com.codeinspector.backend.service;

import com.codeinspector.backend.graph.CodeGraphResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Graph integrity number (I(G)) hesaplama servisi.
 * Grafin yapısal bütünlüğünü ölçer.
 * Formül: I(G) = min{|S| + m(G−S)}
 * 
 * Bu metrik, grafı bozmak için silinen node sayısı ile kalan en büyük parçanın boyutunu 
 * toplayarak minimum değeri bulur.
 */
@Service
public class GraphIntegrityService {

    private static final Logger logger = LoggerFactory.getLogger(GraphIntegrityService.class);
    private static final int MAX_R = 8; // Maksimum deneme sayısı (güvenlik sınırı)
    private static final int MAX_SUBSETS = 200; // Maksimum subset sayısı

    /**
     * Integrity number (I(G)) hesaplar.
     * Hazırlanmış graph data kullanır (performans optimizasyonu).
     * 
     * @param graphData Hazırlanmış graph data (GraphAnalysisHelper.prepareGraphData ile oluşturulmuş)
     * @return Integrity number, veya -1.0 eğer hesaplanamazsa
     */
    public double calculateIntegrityNumber(GraphAnalysisHelper.GraphData graphData) {
        Set<String> allNodes = graphData.allNodes;
        List<GraphAnalysisHelper.UndirectedEdge> allEdges = graphData.undirectedEdges;
        List<String> candidates = graphData.sortedCandidates;

        // Edge case: Boş graf
        if (allNodes.isEmpty()) {
            logger.debug("Empty graph, integrity number = 0.0");
            return 0.0;
        }

        // Edge case: Tek node
        if (allNodes.size() == 1) {
            logger.debug("Single node graph, integrity number = 1.0");
            return 1.0;
        }

        // Edge case: İki node
        if (allNodes.size() == 2) {
            logger.debug("Two node graph, integrity number = 2.0");
            return 2.0; // r=0: maxComponentSize=2, r=1: maxComponentSize=1, r=2: maxComponentSize=0 -> min = 2
        }

        // Edge case: Hiç edge yok
        if (allEdges.isEmpty()) {
            logger.debug("No edges, integrity number = {}", allNodes.size());
            return allNodes.size(); // Her node ayrı component, r=0: maxComponentSize = node sayısı
        }

        logger.info("Calculating integrity for {} nodes, {} edges", allNodes.size(), allEdges.size());

        double bestIntegrity = Double.POSITIVE_INFINITY;
        int maxR = Math.min(MAX_R, allNodes.size()); // En fazla tüm node'ları çıkarabiliriz

        // r = 0'dan başlayarak dene (hiç node çıkarmadan)
        for (int r = 0; r <= maxR; r++) {
            logger.debug("Trying r = {} for integrity", r);

            // r'li subset'ler üret - Limitli kombinasyonlar
            List<Set<String>> subsets = generateLimitedSubsets(candidates, r, MAX_SUBSETS);

            for (Set<String> removedSet : subsets) {
                // Node'ları çıkar
                Set<String> remainingNodes = new HashSet<>(allNodes);
                remainingNodes.removeAll(removedSet);

                if (remainingNodes.isEmpty()) {
                    // Tüm node'lar çıkarıldı, integrity = r + 0 = r
                    bestIntegrity = Math.min(bestIntegrity, r);
                    continue;
                }

                // Edge'leri filtrele (sadece remainingNodes içindeki edge'ler)
                List<GraphAnalysisHelper.UndirectedEdge> remainingEdges = allEdges.stream()
                        .filter(e -> remainingNodes.contains(e.u) && remainingNodes.contains(e.v))
                        .collect(Collectors.toList());

                // Connected components listesini al
                List<Set<String>> components = GraphAnalysisHelper.getConnectedComponents(remainingNodes, remainingEdges);

                if (components.isEmpty()) {
                    // Hiç component yok (tüm node'lar çıkarıldı)
                    bestIntegrity = Math.min(bestIntegrity, r);
                    continue;
                }

                // En büyük component'in boyutunu bul
                int maxComponentSize = 0;
                for (Set<String> component : components) {
                    maxComponentSize = Math.max(maxComponentSize, component.size());
                }

                // Integrity hesapla: r + maxComponentSize
                double integrity = r + maxComponentSize;
                bestIntegrity = Math.min(bestIntegrity, integrity);

                logger.debug("Found integrity = {} (r: {}, maxComponentSize: {})", 
                        integrity, r, maxComponentSize);
            }
        }

        logger.info("Integrity number calculated: {}", bestIntegrity);
        return bestIntegrity == Double.POSITIVE_INFINITY ? -1.0 : bestIntegrity;
    }

    /**
     * Backward compatibility: vertices ve edges'den hesapla.
     * İçeride GraphAnalysisHelper kullanır.
     */
    public double calculateIntegrityNumber(
            List<CodeGraphResult.Vertex> vertices,
            List<CodeGraphResult.Edge> edges) {
        
        GraphAnalysisHelper.GraphData graphData = GraphAnalysisHelper.prepareGraphData(vertices, edges);
        return calculateIntegrityNumber(graphData);
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

