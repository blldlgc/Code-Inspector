package com.codeinspector.backend.service;

import com.codeinspector.backend.graph.CodeGraphResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Graph 2-Vertex Cover Number (β₂(G)) hesaplama servisi.
 * Hem Vertex Cover hem de 2-Domination şartlarını sağlayan minimum node kümesini bulur.
 * 
 * Şartlar:
 * 1. Vertex Cover: Her edge'in en az bir ucu seçili olmalı
 * 2. 2-Domination: Seçilmeyen her node, seçili en az 2 node'a bağlı olmalı
 * 
 * Formül: β₂(G) = min{|S| : S is vertex cover AND ∀v∉S, |N(v)∩S| ≥ 2}
 * 
 * Küçük graflar için exact algoritma, büyük graflar için greedy algoritma kullanır.
 */
@Service
public class GraphTwoVertexCoverService {

    private static final Logger logger = LoggerFactory.getLogger(GraphTwoVertexCoverService.class);
    private static final int EXACT_ALGORITHM_THRESHOLD = 20; // Node sayısı ≤ 20 ise exact algoritma
    private static final int MAX_SUBSETS = 500; // Exact algoritma için maksimum subset sayısı

    /**
     * 2-Vertex Cover sonucunu tutan iç sınıf.
     */
    public static class TwoVertexCoverResult {
        public final int size;
        public final List<String> nodes;

        public TwoVertexCoverResult(int size, List<String> nodes) {
            this.size = size;
            this.nodes = nodes;
        }
    }

    /**
     * 2-Vertex Cover Number (β₂(G)) hesaplar.
     * Hazırlanmış graph data kullanır (performans optimizasyonu).
     * 
     * @param graphData Hazırlanmış graph data (GraphAnalysisHelper.prepareGraphData ile oluşturulmuş)
     * @return TwoVertexCoverResult (size ve nodes listesi), veya size=-1 eğer hesaplanamazsa
     */
    public TwoVertexCoverResult calculateTwoVertexCover(GraphAnalysisHelper.GraphData graphData) {
        Set<String> allNodes = graphData.allNodes;
        List<GraphAnalysisHelper.UndirectedEdge> allEdges = graphData.undirectedEdges;

        // Edge case: Boş graf
        if (allNodes.isEmpty()) {
            logger.debug("Empty graph, 2-vertex cover = 0");
            return new TwoVertexCoverResult(0, new ArrayList<>());
        }

        // Edge case: Tek node
        if (allNodes.size() == 1) {
            logger.debug("Single node graph, 2-vertex cover = 1");
            String singleNode = allNodes.iterator().next();
            return new TwoVertexCoverResult(1, Collections.singletonList(singleNode));
        }

        // Adjacency list oluştur
        Map<String, Set<String>> adj = GraphAnalysisHelper.buildAdjacency(allNodes, allEdges);

        // Algoritma seçimi: Küçük graflar için exact, büyük graflar için greedy
        int n = allNodes.size();
        if (n <= EXACT_ALGORITHM_THRESHOLD) {
            logger.info("Using exact algorithm for {} nodes", n);
            return calculateExactTwoVertexCover(allNodes, allEdges, adj);
        } else {
            logger.info("Using greedy algorithm for {} nodes", n);
            return calculateGreedyTwoVertexCover(allNodes, allEdges, adj);
        }
    }

    /**
     * Exact 2-Vertex Cover hesaplama (küçük graflar için).
     * Tüm kombinasyonları dener ve minimum 2-vertex cover'ı bulur.
     */
    private TwoVertexCoverResult calculateExactTwoVertexCover(
            Set<String> allNodes,
            List<GraphAnalysisHelper.UndirectedEdge> allEdges,
            Map<String, Set<String>> adj) {

        List<String> nodeList = new ArrayList<>(allNodes);

        // k = 1'den başlayarak dene
        for (int k = 1; k <= allNodes.size(); k++) {
            logger.debug("Trying k = {} for exact 2-vertex cover", k);

            // k'li subset'ler üret
            List<Set<String>> subsets = generateLimitedSubsets(nodeList, k, MAX_SUBSETS);

            for (Set<String> subset : subsets) {
                if (isTwoVertexCover(subset, allEdges, allNodes, adj)) {
                    List<String> resultNodes = new ArrayList<>(subset);
                    logger.info("Exact 2-vertex cover found: {} (subset size: {})", k, subset.size());
                    return new TwoVertexCoverResult(k, resultNodes);
                }
            }
        }

        // Fallback: Tüm node'lar 2-vertex cover
        logger.warn("No 2-vertex cover found, returning all nodes");
        return new TwoVertexCoverResult(allNodes.size(), new ArrayList<>(allNodes));
    }

    /**
     * Greedy 2-Vertex Cover hesaplama (büyük graflar için).
     * 1. Leaf ve izole node'ları zorunlu ekle
     * 2. Edge'ler bitene kadar en çok edge kapatan node'u seç
     * 3. 2-domination bozuluyorsa node ekle
     */
    private TwoVertexCoverResult calculateGreedyTwoVertexCover(
            Set<String> allNodes,
            List<GraphAnalysisHelper.UndirectedEdge> allEdges,
            Map<String, Set<String>> adj) {

        Set<String> S = new HashSet<>();
        List<GraphAnalysisHelper.UndirectedEdge> remainingEdges = new ArrayList<>(allEdges);

        // 1. Leaf ve izole node'ları zorunlu ekle (degree ≤ 1)
        for (String v : allNodes) {
            int degree = adj.getOrDefault(v, Collections.emptySet()).size();
            if (degree <= 1) {
                S.add(v);
                // Bu node'un edge'lerini kaldır
                remainingEdges.removeIf(e -> e.u.equals(v) || e.v.equals(v));
                logger.debug("Added leaf/isolated node: {}", v);
            }
        }

        // 2. Edge'ler bitene kadar en çok edge kapatan node'u seç
        while (!remainingEdges.isEmpty()) {
            String bestNode = null;
            int maxCovered = -1;

            for (String v : allNodes) {
                if (S.contains(v)) {
                    continue;
                }

                // Bu node'un kaç edge'i kapattığını hesapla
                int count = 0;
                for (GraphAnalysisHelper.UndirectedEdge e : remainingEdges) {
                    if (e.u.equals(v) || e.v.equals(v)) {
                        count++;
                    }
                }

                if (count > maxCovered) {
                    maxCovered = count;
                    bestNode = v;
                }
            }

            if (bestNode == null) {
                break;
            }

            final String selectedNode = bestNode; // Final copy for lambda
            S.add(selectedNode);
            // Bu node'un edge'lerini kaldır
            remainingEdges.removeIf(e -> e.u.equals(selectedNode) || e.v.equals(selectedNode));
            logger.debug("Selected node: {} (covered {} edges)", selectedNode, maxCovered);
        }

        // 3. 2-domination bozuluyorsa node ekle (döngü ile düzelt)
        boolean fixed;
        do {
            fixed = false;
            for (String v : allNodes) {
                if (!S.contains(v)) {
                    // Bu node'un seçili komşu sayısını hesapla
                    long count = adj.getOrDefault(v, Collections.emptySet()).stream()
                            .filter(S::contains)
                            .count();

                    if (count < 2) {
                        S.add(v);
                        fixed = true;
                        logger.debug("Added node for 2-domination: {} (had {} selected neighbors)", v, count);
                    }
                }
            }
        } while (fixed);

        List<String> resultNodes = new ArrayList<>(S);
        logger.info("Greedy 2-vertex cover: {} (selected {} nodes)", resultNodes.size(), resultNodes.size());
        return new TwoVertexCoverResult(resultNodes.size(), resultNodes);
    }

    /**
     * Vertex Cover kontrolü: Her edge'in en az bir ucu seçili mi?
     */
    private boolean isVertexCover(Set<String> S, List<GraphAnalysisHelper.UndirectedEdge> edges) {
        for (GraphAnalysisHelper.UndirectedEdge e : edges) {
            if (!S.contains(e.u) && !S.contains(e.v)) {
                return false; // Bu edge kapsanmıyor
            }
        }
        return true;
    }

    /**
     * 2-Domination kontrolü: Seçilmeyen her node, seçili en az 2 node'a bağlı mı?
     */
    private boolean isTwoDominating(Set<String> S, Set<String> allNodes, Map<String, Set<String>> adj) {
        for (String v : allNodes) {
            if (!S.contains(v)) {
                // Bu node'un seçili komşu sayısını hesapla
                long count = adj.getOrDefault(v, Collections.emptySet()).stream()
                        .filter(S::contains)
                        .count();

                if (count < 2) {
                    return false; // Bu node yeterince bağlı değil
                }
            }
        }
        return true;
    }

    /**
     * 2-Vertex Cover kontrolü: Hem Vertex Cover hem 2-Domination şartları sağlanıyor mu?
     */
    private boolean isTwoVertexCover(
            Set<String> S,
            List<GraphAnalysisHelper.UndirectedEdge> edges,
            Set<String> allNodes,
            Map<String, Set<String>> adj) {
        return isVertexCover(S, edges) && isTwoDominating(S, allNodes, adj);
    }

    /**
     * Backward compatibility: vertices ve edges'den hesapla.
     * İçeride GraphAnalysisHelper kullanır.
     */
    public TwoVertexCoverResult calculateTwoVertexCover(
            List<CodeGraphResult.Vertex> vertices,
            List<CodeGraphResult.Edge> edges) {
        
        GraphAnalysisHelper.GraphData graphData = GraphAnalysisHelper.prepareGraphData(vertices, edges);
        return calculateTwoVertexCover(graphData);
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

