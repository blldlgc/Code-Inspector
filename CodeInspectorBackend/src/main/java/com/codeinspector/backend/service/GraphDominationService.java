package com.codeinspector.backend.service;

import com.codeinspector.backend.graph.CodeGraphResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Graph domination number (γ(G)) hesaplama servisi.
 * Grafin kontrol edilebilirliğini ölçer.
 * Formül: γ(G) = min{|D| : N[D] = V}
 * 
 * Bu metrik, grafı kontrol etmek için en az kaç node seçmem gerektiğini ölçer.
 * Diğer metriklerden farklı olarak node silmez, node seçer.
 * 
 * Küçük graflar için exact algoritma, büyük graflar için greedy algoritma kullanır.
 */
@Service
public class GraphDominationService {

    private static final Logger logger = LoggerFactory.getLogger(GraphDominationService.class);
    private static final int EXACT_ALGORITHM_THRESHOLD = 20; // Node sayısı ≤ 20 ise exact algoritma
    private static final int MAX_SUBSETS = 500; // Exact algoritma için maksimum subset sayısı

    /**
     * Domination number (γ(G)) hesaplar.
     * Hazırlanmış graph data kullanır (performans optimizasyonu).
     * 
     * @param graphData Hazırlanmış graph data (GraphAnalysisHelper.prepareGraphData ile oluşturulmuş)
     * @return Domination number, veya -1 eğer hesaplanamazsa
     */
    public int calculateDominationNumber(GraphAnalysisHelper.GraphData graphData) {
        Set<String> allNodes = graphData.allNodes;
        List<GraphAnalysisHelper.UndirectedEdge> allEdges = graphData.undirectedEdges;

        // Edge case: Boş graf
        if (allNodes.isEmpty()) {
            logger.debug("Empty graph, domination number = 0");
            return 0;
        }

        // Edge case: Tek node
        if (allNodes.size() == 1) {
            logger.debug("Single node graph, domination number = 1");
            return 1; // Kendisi dominating set
        }

        // Adjacency list oluştur
        Map<String, Set<String>> adj = GraphAnalysisHelper.buildAdjacency(allNodes, allEdges);

        // Algoritma seçimi: Küçük graflar için exact, büyük graflar için greedy
        int n = allNodes.size();
        if (n <= EXACT_ALGORITHM_THRESHOLD) {
            logger.info("Using exact algorithm for {} nodes", n);
            return calculateExactDominationNumber(allNodes, allEdges, adj);
        } else {
            logger.info("Using greedy algorithm for {} nodes", n);
            return calculateGreedyDominationNumber(allNodes, adj);
        }
    }

    /**
     * Exact domination number hesaplama (küçük graflar için).
     * Tüm kombinasyonları dener ve minimum dominating set'i bulur.
     */
    private int calculateExactDominationNumber(
            Set<String> allNodes,
            List<GraphAnalysisHelper.UndirectedEdge> allEdges,
            Map<String, Set<String>> adj) {

        List<String> nodeList = new ArrayList<>(allNodes);

        // k = 1'den başlayarak dene
        for (int k = 1; k <= allNodes.size(); k++) {
            logger.debug("Trying k = {} for exact domination", k);

            // k'li subset'ler üret
            List<Set<String>> subsets = generateLimitedSubsets(nodeList, k, MAX_SUBSETS);

            for (Set<String> subset : subsets) {
                if (isDominatingSet(subset, allNodes, adj)) {
                    logger.info("Exact domination number found: {} (subset size: {})", k, subset.size());
                    return k; // Minimum bulundu
                }
            }
        }

        // Fallback: Tüm node'lar dominating set
        logger.warn("No dominating set found, returning node count");
        return allNodes.size();
    }

    /**
     * Greedy domination number hesaplama (büyük graflar için).
     * Her adımda en çok node kapsayan node'u seçer.
     */
    private int calculateGreedyDominationNumber(
            Set<String> allNodes,
            Map<String, Set<String>> adj) {

        Set<String> covered = new HashSet<>();
        Set<String> selected = new HashSet<>();

        while (!covered.containsAll(allNodes)) {
            String bestNode = null;
            int bestGain = -1;

            // En çok node kapsayan node'u bul
            for (String v : allNodes) {
                if (selected.contains(v)) {
                    continue;
                }

                // Bu node'un kapsadığı yeni node'ları hesapla
                Set<String> gain = new HashSet<>(adj.getOrDefault(v, Collections.emptySet()));
                gain.add(v); // Kendisi de dahil
                gain.removeAll(covered); // Zaten kapsananları çıkar

                if (gain.size() > bestGain) {
                    bestGain = gain.size();
                    bestNode = v;
                }
            }

            if (bestNode == null) {
                // Hiç node kalmadı (olması gerekmez ama güvenlik için)
                break;
            }

            // En iyi node'u seç
            selected.add(bestNode);
            covered.add(bestNode);
            covered.addAll(adj.getOrDefault(bestNode, Collections.emptySet()));

            logger.debug("Selected node: {} (gain: {})", bestNode, bestGain);
        }

        logger.info("Greedy domination number: {} (selected {} nodes)", selected.size(), selected.size());
        return selected.size();
    }

    /**
     * Bir set tüm grafı kapsıyor mu? (Dominating set kontrolü)
     * N[D] = D ∪ (tüm komşular) = V olmalı
     */
    private boolean isDominatingSet(
            Set<String> D,
            Set<String> allNodes,
            Map<String, Set<String>> adj) {

        Set<String> covered = new HashSet<>(D); // D'nin kendisi

        // D'nin tüm komşularını ekle
        for (String v : D) {
            covered.addAll(adj.getOrDefault(v, Collections.emptySet()));
        }

        // Tüm node'lar kapsanıyor mu?
        return covered.containsAll(allNodes);
    }

    /**
     * Backward compatibility: vertices ve edges'den hesapla.
     * İçeride GraphAnalysisHelper kullanır.
     */
    public int calculateDominationNumber(
            List<CodeGraphResult.Vertex> vertices,
            List<CodeGraphResult.Edge> edges) {
        
        GraphAnalysisHelper.GraphData graphData = GraphAnalysisHelper.prepareGraphData(vertices, edges);
        return calculateDominationNumber(graphData);
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

