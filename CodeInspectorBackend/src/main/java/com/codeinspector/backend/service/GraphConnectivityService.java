package com.codeinspector.backend.service;

import com.codeinspector.backend.graph.CodeGraphResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Graph connectivity number (κ(G)) hesaplama servisi.
 * Grafı bağlantısız yapmak için çıkarılması gereken minimum node sayısını bulur.
 */
@Service
public class GraphConnectivityService {

    private static final Logger logger = LoggerFactory.getLogger(GraphConnectivityService.class);
    private static final int MAX_R = 10; // Maksimum deneme sayısı

    /**
     * Connectivity number (κ(G)) hesaplar.
     * Hazırlanmış graph data kullanır (performans optimizasyonu).
     * 
     * @param graphData Hazırlanmış graph data (GraphAnalysisHelper.prepareGraphData ile oluşturulmuş)
     * @return Connectivity number, veya -1 eğer hesaplanamazsa
     */
    public int calculateConnectivityNumber(GraphAnalysisHelper.GraphData graphData) {
        Set<String> allNodes = graphData.allNodes;
        List<GraphAnalysisHelper.UndirectedEdge> undirectedEdges = graphData.undirectedEdges;
        List<String> candidates = graphData.sortedCandidates;

        // Edge case: Boş graf
        if (allNodes.isEmpty()) {
            logger.debug("Empty vertices, connectivity number = 0");
            return 0;
        }

        // Edge case: Tek node
        if (allNodes.size() == 1) {
            logger.debug("Single node graph, connectivity number = 0");
            return 0;
        }

        logger.info("Calculating connectivity for {} nodes, {} edges", allNodes.size(), undirectedEdges.size());

        // Edge case: Hiç edge yok (tüm node'lar izole)
        if (undirectedEdges.isEmpty()) {
            logger.debug("No valid edges, connectivity number = 0");
            return 0;
        }

        logger.debug("Node degrees calculated. Top 5: {}", 
                candidates.stream().limit(5)
                        .map(n -> n + "(" + graphData.degree.get(n) + ")")
                        .collect(Collectors.joining(", ")));

        // ADIM 4: r = 1'den başlayarak dene
        for (int r = 1; r <= Math.min(MAX_R, allNodes.size() - 1); r++) {
            logger.debug("Trying r = {}", r);

            // r'li subset'ler üret - TÜM kombinasyonları dene
            List<Set<String>> subsets = generateAllSubsets(candidates, r);

            for (Set<String> removedSet : subsets) {
                // ADIM 5: Node'ları çıkar ve grafı sıfırdan oluştur
                Set<String> remainingNodes = new HashSet<>(allNodes);
                remainingNodes.removeAll(removedSet);

                List<GraphAnalysisHelper.UndirectedEdge> remainingEdges = undirectedEdges.stream()
                        .filter(e -> remainingNodes.contains(e.u) && remainingNodes.contains(e.v))
                        .collect(Collectors.toList());

                // ADIM 6: Connected components hesapla
                int componentCount = GraphAnalysisHelper.countConnectedComponents(remainingNodes, remainingEdges);

                // ADIM 7: Parçalandı mı?
                if (componentCount >= 2) {
                    logger.info("Graph disconnected with r = {} (removed: {}), components: {}", 
                            r, removedSet, componentCount);
                    return r;
                }
            }
        }

        // Hiçbir r değeri ile parçalanamadıysa
        // Bu durumda graf complete graph veya çok bağlantılı bir graf
        // Connectivity number = n - 1 (tüm node'ları çıkarırsak bağlantısız olur)
        int connectivityNumber = allNodes.size() - 1;
        logger.info("Graph remains connected even after removing {} nodes. Connectivity number = {}", 
                Math.min(MAX_R, allNodes.size() - 1), connectivityNumber);
        return connectivityNumber;
    }

    /**
     * Backward compatibility: vertices ve edges'den hesapla.
     * İçeride GraphAnalysisHelper kullanır.
     */
    public int calculateConnectivityNumber(
            List<CodeGraphResult.Vertex> vertices,
            List<CodeGraphResult.Edge> edges) {

        GraphAnalysisHelper.GraphData graphData = GraphAnalysisHelper.prepareGraphData(vertices, edges);
        return calculateConnectivityNumber(graphData);
    }

    /**
     * Undirected edge listesi oluştur.
     * Tüm edge tiplerini (depends, has, calls) dahil eder.
     */
    private List<UndirectedEdge> buildUndirectedEdges(
            List<CodeGraphResult.Edge> edges,
            Set<String> validNodes) {
        
        List<UndirectedEdge> undirectedEdges = new ArrayList<>();
        Set<String> edgeSet = new HashSet<>(); // Duplicate kontrolü için

        for (CodeGraphResult.Edge e : edges) {
            String source = e.getSource();
            String target = e.getTarget();

            // Sadece geçerli node'lar arasındaki edge'leri al
            if (!validNodes.contains(source) || !validNodes.contains(target)) {
                continue;
            }

            // Undirected edge: (u, v) ve (v, u) aynı
            String edgeKey1 = source + "|" + target;
            String edgeKey2 = target + "|" + source;

            if (!edgeSet.contains(edgeKey1) && !edgeSet.contains(edgeKey2)) {
                undirectedEdges.add(new UndirectedEdge(source, target));
                edgeSet.add(edgeKey1);
            }
        }

        logger.debug("Built {} undirected edges from {} directed edges", 
                undirectedEdges.size(), edges.size());
        return undirectedEdges;
    }

    /**
     * Her node'un degree'sini hesapla (undirected graph için).
     */
    private Map<String, Integer> calculateDegree(
            Set<String> nodes,
            List<UndirectedEdge> edges) {
        
        Map<String, Integer> degree = new HashMap<>();
        for (String node : nodes) {
            degree.put(node, 0);
        }

        for (UndirectedEdge e : edges) {
            degree.put(e.u, degree.get(e.u) + 1);
            degree.put(e.v, degree.get(e.v) + 1);
        }

        return degree;
    }

    /**
     * r'li subset'ler üret - TÜM kombinasyonları dene.
     * Degree'ye göre sıralanmış node'lardan başlayarak tüm kombinasyonları üretir.
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

    /**
     * Connected components sayısını hesapla (DFS ile).
     */
    private int countConnectedComponents(
            Set<String> nodes,
            List<UndirectedEdge> edges) {
        
        if (nodes.isEmpty()) {
            return 0;
        }

        // Adjacency list oluştur
        Map<String, Set<String>> adj = new HashMap<>();
        for (String node : nodes) {
            adj.put(node, new HashSet<>());
        }

        for (UndirectedEdge e : edges) {
            adj.get(e.u).add(e.v);
            adj.get(e.v).add(e.u);
        }

        // DFS ile bileşenleri bul
        Set<String> visited = new HashSet<>();
        int componentCount = 0;

        for (String start : nodes) {
            if (!visited.contains(start)) {
                dfs(start, adj, visited);
                componentCount++;
            }
        }

        return componentCount;
    }

    /**
     * DFS traversal.
     */
    private void dfs(String node, Map<String, Set<String>> adj, Set<String> visited) {
        visited.add(node);
        for (String neighbor : adj.getOrDefault(node, Collections.emptySet())) {
            if (!visited.contains(neighbor)) {
                dfs(neighbor, adj, visited);
            }
        }
    }

    /**
     * Undirected edge temsili.
     */
    private static class UndirectedEdge {
        final String u;
        final String v;

        UndirectedEdge(String u, String v) {
            this.u = u;
            this.v = v;
        }
    }
}


