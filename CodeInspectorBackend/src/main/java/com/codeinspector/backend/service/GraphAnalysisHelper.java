package com.codeinspector.backend.service;

import com.codeinspector.backend.graph.CodeGraphResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Graph analizi için ortak yardımcı sınıf.
 * Node'ları toplama, undirected edge oluşturma, degree hesaplama gibi
 * ortak işlemleri bir kere yapıp her iki servis (Connectivity ve Scattering) için de kullanır.
 */
public class GraphAnalysisHelper {

    private static final Logger logger = LoggerFactory.getLogger(GraphAnalysisHelper.class);

    /**
     * Hazırlanmış graph data'yı tutan iç sınıf.
     */
    public static class GraphData {
        public final Set<String> allNodes;
        public final List<UndirectedEdge> undirectedEdges;
        public final Map<String, Integer> degree;
        public final List<String> sortedCandidates; // Degree'ye göre sıralanmış

        public GraphData(Set<String> allNodes, List<UndirectedEdge> undirectedEdges,
                        Map<String, Integer> degree, List<String> sortedCandidates) {
            this.allNodes = allNodes;
            this.undirectedEdges = undirectedEdges;
            this.degree = degree;
            this.sortedCandidates = sortedCandidates;
        }
    }

    /**
     * Undirected edge temsili.
     */
    public static class UndirectedEdge {
        public final String u;
        public final String v;

        public UndirectedEdge(String u, String v) {
            this.u = u;
            this.v = v;
        }
    }

    /**
     * Graph data'yı hazırla (node'lar, edge'ler, degree, sıralanmış candidate listesi).
     * Bu işlem bir kere yapılır ve her iki metrik (Connectivity ve Scattering) için kullanılır.
     */
    public static GraphData prepareGraphData(
            List<CodeGraphResult.Vertex> vertices,
            List<CodeGraphResult.Edge> edges) {

        // 1. Node'ları topla
        Set<String> allNodes = vertices.stream()
                .map(CodeGraphResult.Vertex::getId)
                .collect(Collectors.toSet());

        logger.debug("Preparing graph data for {} nodes, {} edges", allNodes.size(), edges.size());

        // 2. Undirected edge listesi oluştur
        List<UndirectedEdge> undirectedEdges = buildUndirectedEdges(edges, allNodes);

        // 3. Degree hesapla
        Map<String, Integer> degree = calculateDegree(allNodes, undirectedEdges);

        // 4. Node'ları degree'ye göre sırala
        List<String> sortedCandidates = allNodes.stream()
                .sorted((a, b) -> Integer.compare(degree.getOrDefault(b, 0), degree.getOrDefault(a, 0)))
                .collect(Collectors.toList());

        logger.debug("Graph data prepared: {} nodes, {} edges, top degree: {}", 
                allNodes.size(), undirectedEdges.size(),
                sortedCandidates.isEmpty() ? 0 : degree.get(sortedCandidates.get(0)));

        return new GraphData(allNodes, undirectedEdges, degree, sortedCandidates);
    }

    /**
     * Undirected edge listesi oluştur.
     * Tüm edge tiplerini (depends, has, calls) dahil eder.
     */
    private static List<UndirectedEdge> buildUndirectedEdges(
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
    private static Map<String, Integer> calculateDegree(
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
     * Connected components sayısını hesapla (DFS ile).
     */
    public static int countConnectedComponents(
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
    private static void dfs(String node, Map<String, Set<String>> adj, Set<String> visited) {
        visited.add(node);
        for (String neighbor : adj.getOrDefault(node, Collections.emptySet())) {
            if (!visited.contains(neighbor)) {
                dfs(neighbor, adj, visited);
            }
        }
    }

    /**
     * Adjacency list oluştur (undirected graph için).
     * Rupture number hesaplama için gerekli.
     */
    public static Map<String, Set<String>> buildAdjacency(
            Set<String> nodes,
            List<UndirectedEdge> edges) {

        Map<String, Set<String>> adj = new HashMap<>();
        for (String node : nodes) {
            adj.put(node, new HashSet<>());
        }

        for (UndirectedEdge e : edges) {
            adj.get(e.u).add(e.v);
            adj.get(e.v).add(e.u);
        }

        return adj;
    }

    /**
     * Connected components listesini döndür (en büyük parçayı bulmak için).
     * Her component bir Set<String> olarak döner.
     */
    public static List<Set<String>> getConnectedComponents(
            Set<String> nodes,
            List<UndirectedEdge> edges) {

        if (nodes.isEmpty()) {
            return new ArrayList<>();
        }

        // Adjacency list oluştur
        Map<String, Set<String>> adj = buildAdjacency(nodes, edges);

        // DFS ile bileşenleri bul
        Set<String> visited = new HashSet<>();
        List<Set<String>> components = new ArrayList<>();

        for (String start : nodes) {
            if (!visited.contains(start)) {
                Set<String> component = new HashSet<>();
                dfsWithComponent(start, adj, visited, component);
                components.add(component);
            }
        }

        return components;
    }

    /**
     * DFS traversal ile component toplama.
     */
    private static void dfsWithComponent(String node, Map<String, Set<String>> adj, 
                                        Set<String> visited, Set<String> component) {
        visited.add(node);
        component.add(node);
        for (String neighbor : adj.getOrDefault(node, Collections.emptySet())) {
            if (!visited.contains(neighbor)) {
                dfsWithComponent(neighbor, adj, visited, component);
            }
        }
    }
}


