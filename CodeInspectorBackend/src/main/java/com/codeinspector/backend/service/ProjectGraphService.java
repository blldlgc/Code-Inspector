package com.codeinspector.backend.service;

import com.codeinspector.backend.graph.CodeGraphResult;
import com.codeinspector.backend.graph.CodeGraphResult.Edge;
import com.codeinspector.backend.graph.CodeGraphResult.GraphMetrics;
import com.codeinspector.backend.graph.CodeGraphResult.Vertex;
import com.codeinspector.backend.model.Project;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Proje klasöründeki Java dosyalarından basit bir sınıf/metot grafı üreten servis.
 * Bu servis sadece okuma yapar; JGit vb. bağımlılıklara ihtiyaç duymaz.
 */
@Service
public class ProjectGraphService {

    private static final Logger logger = LoggerFactory.getLogger(ProjectGraphService.class);
    
    private final JavaASTDependencyAnalyzer astAnalyzer;
    private final GraphConnectivityService connectivityService;
    private final GraphScatteringService scatteringService;
    private final GraphRuptureService ruptureService;
    private final GraphIntegrityService integrityService;
    private final GraphToughnessService toughnessService;
    private final GraphDominationService dominationService;
    private final GraphTwoVertexCoverService twoVertexCoverService;

    public ProjectGraphService(JavaASTDependencyAnalyzer astAnalyzer, 
                              GraphConnectivityService connectivityService,
                              GraphScatteringService scatteringService,
                              GraphRuptureService ruptureService,
                              GraphIntegrityService integrityService,
                              GraphToughnessService toughnessService,
                              GraphDominationService dominationService,
                              GraphTwoVertexCoverService twoVertexCoverService) {
        this.astAnalyzer = astAnalyzer;
        this.connectivityService = connectivityService;
        this.scatteringService = scatteringService;
        this.ruptureService = ruptureService;
        this.integrityService = integrityService;
        this.toughnessService = toughnessService;
        this.dominationService = dominationService;
        this.twoVertexCoverService = twoVertexCoverService;
    }

    // Basit regex'ler – production için tam parser yerine hafif bir analiz
    private static final Pattern PACKAGE_PATTERN = Pattern.compile("^\\s*package\\s+([\\w\\.]+)\\s*;", Pattern.MULTILINE);
    private static final Pattern CLASS_PATTERN = Pattern.compile("\\bclass\\s+(\\w+)");
    private static final Pattern IMPORT_PATTERN = Pattern.compile("^\\s*import\\s+(?:static\\s+)?([\\w\\.]+)(?:\\.[*])?\\s*;", Pattern.MULTILINE);
    private static final Pattern METHOD_PATTERN = Pattern.compile(
            "(public|protected|private|static|final|native|synchronized|abstract)\\s+[\\w<>\\[\\]]+\\s+(\\w+)\\s*\\("
    );

    /**
     * Verilen proje için disk üzerindeki kaynak koddan graf oluşturur.
     */
    public CodeGraphResult analyzeProject(Project project) throws IOException {
        String storagePath = project.getStoragePath();
        if (storagePath == null || storagePath.isBlank()) {
            throw new IOException("Project storage path is not set for project: " + project.getSlug());
        }

        Path root = Paths.get(storagePath);
        if (!Files.exists(root)) {
            throw new IOException("Project storage path does not exist: " + root.toAbsolutePath());
        }

        logger.info("Building code graph for project {} at {}", project.getSlug(), root.toAbsolutePath());

        Map<String, Set<String>> classToMethods = new HashMap<>();
        Map<String, Set<String>> classDeps = new HashMap<>();
        Map<String, Set<String>> methodCalls = new HashMap<>(); // className.methodName -> Set<targetMethodId>
        
        // Projedeki tüm sınıfların full name'lerini tut (sınıflar arası bağlantılar için)
        Set<String> projectClasses = new HashSet<>();
        // Simple name -> full name mapping (aynı simple name'e sahip birden fazla sınıf olabilir)
        Map<String, Set<String>> simpleNameToFullNames = new HashMap<>();

        // İlk geçiş: Tüm sınıfları bul ve map'le
        Files.walk(root)
                .filter(p -> p.toString().endsWith(".java"))
                .limit(2000)
                .forEach(path -> {
                    try {
                        String content = Files.readString(path, StandardCharsets.UTF_8);
                        String pkg = extractPackage(content);
                        Matcher classMatcher = CLASS_PATTERN.matcher(content);
                        if (classMatcher.find()) {
                            String simpleClassName = classMatcher.group(1);
                            String fullClassName = (pkg != null ? pkg + "." : "") + simpleClassName;
                            
                            projectClasses.add(fullClassName);
                            simpleNameToFullNames.computeIfAbsent(simpleClassName, k -> new HashSet<>()).add(fullClassName);
                        }
                    } catch (IOException e) {
                        logger.warn("Failed to read Java file {}: {}", path, e.getMessage());
                    }
                });

        logger.info("Found {} classes in project", projectClasses.size());
        logger.debug("Project classes: {}", projectClasses);

        // İkinci geçiş: Sınıfları, metotları ve bağımlılıkları parse et
        Files.walk(root)
                .filter(p -> p.toString().endsWith(".java"))
                .limit(2000) // çok büyük projeler için güvenlik sınırı
                .forEach(path -> {
                    try {
                        parseJavaFile(path, classToMethods, classDeps, methodCalls, projectClasses, simpleNameToFullNames);
                    } catch (IOException e) {
                        logger.warn("Failed to parse Java file {}: {}", path, e.getMessage());
                    }
                });

        // Vertex ve edge listelerini oluştur
        List<Vertex> vertices = new ArrayList<>();
        List<Edge> edges = new ArrayList<>();

        // TÜM sınıfları vertex olarak ekle (sadece method'u olanlar değil)
        // Çünkü bağımlılığı olan ama method'u olmayan sınıflar da edge'lerde kullanılıyor
        Set<String> allClasses = new HashSet<>(projectClasses);
        allClasses.addAll(classToMethods.keySet());
        allClasses.addAll(classDeps.keySet());
        
        for (String className : allClasses) {
            // Eğer bu sınıf zaten eklenmişse atla (duplicate kontrolü)
            boolean alreadyAdded = vertices.stream().anyMatch(v -> className.equals(v.getId()));
            if (alreadyAdded) {
                continue;
            }
            
            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalMethods", classToMethods.getOrDefault(className, Collections.emptySet()).size());
            metrics.put("totalDependencies", classDeps.getOrDefault(className, Collections.emptySet()).size());

            vertices.add(new Vertex(
                    className,
                    className,
                    "class",
                    metrics
            ));
        }
        
        logger.info("Created {} class vertices (from {} total project classes)", vertices.size(), projectClasses.size());

        // Metot düğümleri ve Class -> Method kenarları
        for (Map.Entry<String, Set<String>> entry : classToMethods.entrySet()) {
            String className = entry.getKey();
            for (String methodId : entry.getValue()) {
                String methodName = methodId.substring(methodId.lastIndexOf('.') + 1);
                vertices.add(new Vertex(
                        methodId,
                        methodName + "()",
                        "method",
                        Map.of("parentClass", className)
                ));
                edges.add(new Edge(className, methodId, "has"));
            }
        }

        // Sınıf bağımlılık kenarları - sadece projedeki sınıflar arasında
        int dependsEdgeCount = 0;
        Set<String> connectedClasses = new HashSet<>();
        Set<String> vertexIds = new HashSet<>();
        for (Vertex v : vertices) {
            vertexIds.add(v.getId());
        }
        
        for (Map.Entry<String, Set<String>> entry : classDeps.entrySet()) {
            String source = entry.getKey();
            Set<String> deps = entry.getValue();
            logger.info("Class {} has {} dependencies in classDeps: {}", source, deps.size(), deps);
            
            // Source'un vertex olarak eklenmiş olduğundan emin ol
            if (!vertexIds.contains(source)) {
                logger.warn("Source class {} not found in vertices! This should not happen.", source);
                continue;
            }
            
            for (String target : deps) {
                if (source.equals(target)) {
                    logger.debug("Skipped self-reference: {} -> {}", source, target);
                    continue;
                }
                
                if (projectClasses.contains(target)) {
                    // Target'ın da vertex olarak eklenmiş olduğundan emin ol
                    if (!vertexIds.contains(target)) {
                        logger.warn("Target class {} not found in vertices! Skipping edge {} -> {}", target, source, target);
                        continue;
                    }
                    
                    // Sadece projedeki sınıflar arasında bağlantı kur
                    edges.add(new Edge(source, target, "depends"));
                    dependsEdgeCount++;
                    connectedClasses.add(source);
                    connectedClasses.add(target);
                    logger.info("✅ Created depends edge: {} -> {}", source, target);
                } else {
                    logger.debug("Skipped edge {} -> {} (target '{}' not in projectClasses)", source, target, target);
                }
            }
        }
        logger.info("Created {} depends edges between classes", dependsEdgeCount);
        
        // Metot-metot çağrı kenarları (calls)
        int callsEdgeCount = 0;
        for (Map.Entry<String, Set<String>> entry : methodCalls.entrySet()) {
            String sourceMethodId = entry.getKey(); // className.methodName
            Set<String> calledMethods = entry.getValue();
            
            // Source method'un vertex olarak eklenmiş olduğundan emin ol
            if (!vertexIds.contains(sourceMethodId)) {
                logger.debug("Source method {} not found in vertices, skipping calls edges", sourceMethodId);
                continue;
            }
            
            for (String calledMethod : calledMethods) {
                // Called method'un vertex olarak eklenmiş olduğundan emin ol
                if (vertexIds.contains(calledMethod)) {
                    edges.add(new Edge(sourceMethodId, calledMethod, "calls"));
                    callsEdgeCount++;
                    logger.debug("Created calls edge: {} -> {}", sourceMethodId, calledMethod);
                } else {
                    // Eğer calledMethod sadece method name ise (scope yok), className.methodName formatında dene
                    String[] sourceParts = sourceMethodId.split("\\.");
                    if (sourceParts.length >= 2) {
                        String sourceClassName = sourceParts[0];
                        String potentialMethodId = sourceClassName + "." + calledMethod;
                        if (vertexIds.contains(potentialMethodId)) {
                            edges.add(new Edge(sourceMethodId, potentialMethodId, "calls"));
                            callsEdgeCount++;
                            logger.debug("Created calls edge (resolved): {} -> {}", sourceMethodId, potentialMethodId);
                        }
                    }
                }
            }
        }
        logger.info("Created {} calls edges between methods", callsEdgeCount);
        logger.info("Total edges created: {} ({} depends, {} has, {} calls)", 
                edges.size(), dependsEdgeCount, edges.size() - dependsEdgeCount - callsEdgeCount, callsEdgeCount);
        
        // Debug: classDeps özeti
        int totalDeps = classDeps.values().stream().mapToInt(Set::size).sum();
        logger.info("Total dependencies found in classDeps: {} (before filtering)", totalDeps);
        
        // Eğer hiç bağımlılık yoksa veya çok azsa, tüm sınıfları bir merkezi node'a bağla
        // Bu, görselleştirmede en azından sınıfların görünmesini sağlar
        int totalClassCount = projectClasses.size();
        if (dependsEdgeCount == 0 && totalClassCount > 1) {
            logger.warn("No class dependencies found! Creating a central hub node to connect all classes.");
            
            // Merkezi hub node oluştur
            String hubNodeId = "__ROOT__";
            String hubNodeLabel = "Project Root";
            vertices.add(new Vertex(
                    hubNodeId,
                    hubNodeLabel,
                    "class",
                    Map.of("isHub", true, "connectedClasses", totalClassCount)
            ));
            
            // TÜM sınıfları hub'a bağla (sadece method'u olanlar değil)
            // Hub node eklendi, vertexIds'i güncelle
            vertexIds.add(hubNodeId);
            
            int hubEdgesCreated = 0;
            for (String className : projectClasses) {
                // Sınıfın vertex olarak eklenmiş olduğundan emin ol
                if (!vertexIds.contains(className)) {
                    logger.warn("Class {} not found in vertices when creating hub edge! Skipping.", className);
                    continue;
                }
                edges.add(new Edge(className, hubNodeId, "depends"));
                dependsEdgeCount++;
                hubEdgesCreated++;
            }
            logger.info("Created {} hub edges connecting {} classes to root", hubEdgesCreated, totalClassCount);
        } else if (dependsEdgeCount < totalClassCount / 2 && totalClassCount > 3) {
            // Eğer bağlı sınıf sayısı toplam sınıf sayısının yarısından azsa, 
            // bağlı olmayan sınıfları hub'a bağla
            logger.info("Some classes are not connected. Connecting isolated classes to a hub.");
            
            String hubNodeId = "__ROOT__";
            boolean hubExists = vertices.stream().anyMatch(v -> hubNodeId.equals(v.getId()));
            
            if (!hubExists) {
                vertices.add(new Vertex(
                        hubNodeId,
                        "Project Root",
                        "class",
                        Map.of("isHub", true)
                ));
            }
            
            // Hub node eklendi, vertexIds'i güncelle
            vertexIds.add(hubNodeId);
            
            int isolatedCount = 0;
            // TÜM sınıfları kontrol et, sadece method'u olanlar değil
            for (String className : projectClasses) {
                if (!connectedClasses.contains(className)) {
                    // Sınıfın vertex olarak eklenmiş olduğundan emin ol
                    if (!vertexIds.contains(className)) {
                        logger.warn("Isolated class {} not found in vertices! Skipping hub edge.", className);
                        continue;
                    }
                    edges.add(new Edge(className, hubNodeId, "depends"));
                    isolatedCount++;
                }
            }
            logger.info("Connected {} isolated classes to hub", isolatedCount);
        }

        GraphMetrics metrics = calculateMetrics(vertices, edges);

        CodeGraphResult result = new CodeGraphResult();
        result.setVertices(vertices);
        result.setEdges(edges);
        result.setMetrics(metrics);
        return result;
    }

    private String extractPackage(String content) {
        Matcher pkgMatcher = PACKAGE_PATTERN.matcher(content);
        if (pkgMatcher.find()) {
            return pkgMatcher.group(1);
        }
        return null;
    }

    private void parseJavaFile(
            Path file,
            Map<String, Set<String>> classToMethods,
            Map<String, Set<String>> classDeps,
            Map<String, Set<String>> methodCalls,
            Set<String> projectClasses,
            Map<String, Set<String>> simpleNameToFullNames
    ) throws IOException {
        String content = Files.readString(file, StandardCharsets.UTF_8);

        // package
        String pkg = extractPackage(content);

        // class name
        Matcher classMatcher = CLASS_PATTERN.matcher(content);
        if (!classMatcher.find()) {
            return;
        }
        String simpleClassName = classMatcher.group(1);
        String fullClassName = (pkg != null ? pkg + "." : "") + simpleClassName;

        classToMethods.computeIfAbsent(fullClassName, k -> new HashSet<>());
        classDeps.computeIfAbsent(fullClassName, k -> new HashSet<>());
        
        // AST analizi ile detaylı bağımlılık tespiti (fallback: regex analizi)
        try {
            File javaFile = file.toFile();
            
            // AST ile sınıf bağımlılıklarını analiz et
            Map<String, Set<String>> astClassDeps = astAnalyzer.analyzeClassDependencies(javaFile);
            if (astClassDeps.containsKey(simpleClassName)) {
                Set<String> astDeps = astClassDeps.get(simpleClassName);
                logger.debug("AST found {} potential dependencies for {}: {}", astDeps.size(), fullClassName, astDeps);
                
                int addedCount = 0;
                // AST'den gelen bağımlılıkları ekle (full name matching ile)
                for (String depName : astDeps) {
                    boolean added = false;
                    
                    // Önce full qualified name ile kontrol et
                    if (projectClasses.contains(depName)) {
                        classDeps.get(fullClassName).add(depName);
                        added = true;
                        addedCount++;
                        logger.debug("Added dependency (full match): {} -> {}", fullClassName, depName);
                    } else {
                        // Simple name ile eşleştir (depName simple name olabilir)
                        String depSimpleName = depName.contains(".") ? 
                            depName.substring(depName.lastIndexOf('.') + 1) : depName;
                        
                        Set<String> matchingFullNames = simpleNameToFullNames.get(depSimpleName);
                        if (matchingFullNames != null && !matchingFullNames.isEmpty()) {
                            String matchedFullName = null;
                            if (matchingFullNames.size() == 1) {
                                // Tek eşleşme varsa direkt kullan
                                matchedFullName = matchingFullNames.iterator().next();
                            } else {
                                // Birden fazla eşleşme varsa, aynı package içindeki varsa onu kullan
                                boolean found = false;
                                for (String candidateFullName : matchingFullNames) {
                                    if (candidateFullName.startsWith(pkg != null ? pkg + "." : "")) {
                                        matchedFullName = candidateFullName;
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    matchedFullName = matchingFullNames.iterator().next();
                                }
                            }
                            
                            if (matchedFullName != null && !matchedFullName.equals(fullClassName)) {
                                classDeps.get(fullClassName).add(matchedFullName);
                                added = true;
                                addedCount++;
                                logger.debug("Added dependency (simple match): {} -> {} (from {})", 
                                        fullClassName, matchedFullName, depSimpleName);
                            }
                        }
                    }
                    
                    if (!added) {
                        logger.debug("Could not match dependency: {} for class {}", depName, fullClassName);
                    }
                }
                logger.info("AST analysis added {} class dependencies for {} (from {} potential)", 
                        addedCount, fullClassName, astDeps.size());
            } else {
                logger.debug("AST analysis found no dependencies for class {}", simpleClassName);
            }
            
            // AST ile metot bağımlılıklarını analiz et
            Map<String, Map<String, Set<String>>> astMethodDeps = astAnalyzer.analyzeMethodDependencies(javaFile);
            if (astMethodDeps.containsKey(simpleClassName)) {
                Map<String, Set<String>> classMethodDeps = astMethodDeps.get(simpleClassName);
                for (Map.Entry<String, Set<String>> methodEntry : classMethodDeps.entrySet()) {
                    String methodName = methodEntry.getKey();
                    String methodId = fullClassName + "." + methodName;
                    Set<String> calledMethods = methodEntry.getValue();
                    
                    // Metot çağrılarını methodCalls map'ine ekle
                    methodCalls.computeIfAbsent(methodId, k -> new HashSet<>()).addAll(calledMethods);
                }
                logger.debug("AST analysis added method dependencies for {} methods in {}", 
                        classMethodDeps.size(), fullClassName);
            }
        } catch (Exception e) {
            logger.warn("AST analysis failed for file {}, falling back to regex: {}", file, e.getMessage());
            // AST başarısız olursa regex analizi devam eder
        }

        // imports -> class dependencies
        Matcher importMatcher = IMPORT_PATTERN.matcher(content);
        while (importMatcher.find()) {
            String importedFull = importMatcher.group(1);
            
            // External library'leri hariç tut (java.*, javax.*, org.springframework.* vb.)
            if (importedFull.startsWith("java.") || 
                importedFull.startsWith("javax.") ||
                importedFull.startsWith("org.springframework.") ||
                importedFull.startsWith("org.hibernate.") ||
                importedFull.startsWith("com.sun.") ||
                importedFull.startsWith("sun.")) {
                continue;
            }
            
            // Önce full name ile kontrol et
            if (projectClasses.contains(importedFull)) {
                classDeps.get(fullClassName).add(importedFull);
                logger.debug("Added dependency (full match): {} -> {}", fullClassName, importedFull);
            } else {
                // Simple name ile kontrol et
                String importedSimple = importedFull.substring(importedFull.lastIndexOf('.') + 1);
                Set<String> matchingFullNames = simpleNameToFullNames.get(importedSimple);
                
                if (matchingFullNames != null && !matchingFullNames.isEmpty()) {
                    String matchedFullName = null;
                    // Eğer tek bir eşleşme varsa veya aynı package içindeyse kullan
                    if (matchingFullNames.size() == 1) {
                        // Tek eşleşme varsa direkt kullan
                        matchedFullName = matchingFullNames.iterator().next();
                        classDeps.get(fullClassName).add(matchedFullName);
                        logger.debug("Added dependency (simple match, single): {} -> {}", fullClassName, matchedFullName);
                    } else {
                        // Birden fazla eşleşme varsa, aynı package içindeki varsa onu kullan
                        boolean found = false;
                        for (String candidateFullName : matchingFullNames) {
                            if (candidateFullName.startsWith(pkg != null ? pkg + "." : "")) {
                                matchedFullName = candidateFullName;
                                classDeps.get(fullClassName).add(matchedFullName);
                                found = true;
                                logger.debug("Added dependency (simple match, same package): {} -> {}", fullClassName, matchedFullName);
                                break;
                            }
                        }
                        // Aynı package'da bulunamazsa ilk eşleşmeyi kullan
                        if (!found) {
                            matchedFullName = matchingFullNames.iterator().next();
                            classDeps.get(fullClassName).add(matchedFullName);
                            logger.debug("Added dependency (simple match, first): {} -> {}", fullClassName, matchedFullName);
                        }
                    }
                } else {
                    logger.debug("No match found for import: {} in class {}", importedFull, fullClassName);
                }
            }
        }

        // methods
        Matcher methodMatcher = METHOD_PATTERN.matcher(content);
        while (methodMatcher.find()) {
            String methodName = methodMatcher.group(2);
            String methodId = fullClassName + "." + methodName;
            classToMethods.get(fullClassName).add(methodId);
        }
    }

    private GraphMetrics calculateMetrics(List<Vertex> vertices, List<Edge> edges) {
        GraphMetrics m = new GraphMetrics();
        m.setTotalNodes(vertices.size());
        m.setTotalEdges(edges.size());

        Map<String, Integer> degree = new HashMap<>();
        for (Edge e : edges) {
            degree.merge(e.getSource(), 1, Integer::sum);
            degree.merge(e.getTarget(), 1, Integer::sum);
        }

        int max = 0;
        int sum = 0;
        for (int d : degree.values()) {
            max = Math.max(max, d);
            sum += d;
        }
        m.setMaxDegree(max);
        m.setAvgDegree(degree.isEmpty() ? 0.0 : (double) sum / degree.size());
        
        // Degree Distribution hesapla
        Map<Integer, Integer> degreeDistribution = new HashMap<>();
        for (int d : degree.values()) {
            degreeDistribution.merge(d, 1, Integer::sum);
        }
        // Degree 0 olan node'ları da ekle (hiç edge'i olmayan node'lar)
        int nodesWithEdges = degree.size();
        int isolatedNodes = vertices.size() - nodesWithEdges;
        if (isolatedNodes > 0) {
            degreeDistribution.put(0, isolatedNodes);
        }
        m.setDegreeDistribution(degreeDistribution);
        
        // ORTAK GRAPH DATA HAZIRLA (BİR KERE) - Performans optimizasyonu
        GraphAnalysisHelper.GraphData graphData = null;
        try {
            graphData = GraphAnalysisHelper.prepareGraphData(vertices, edges);
            logger.debug("Graph data prepared: {} nodes, {} edges", 
                    graphData.allNodes.size(), graphData.undirectedEdges.size());
        } catch (Exception e) {
            logger.warn("Failed to prepare graph data: {}", e.getMessage(), e);
        }
        
        // Connectivity number hesapla (hazır graph data ile)
        if (graphData != null) {
            try {
                int totalNodes = graphData.allNodes.size();
                String method = totalNodes > 30 ? "HEURISTIC" : "EXACT";
                int connectivityNumber = connectivityService.calculateConnectivityNumber(graphData);
                m.setConnectivityNumber(connectivityNumber);
                m.setConnectivityCalculationMethod(method);
                logger.info("Connectivity number calculated: {} (method: {})", connectivityNumber, method);
            } catch (Exception e) {
                logger.warn("Failed to calculate connectivity number: {}", e.getMessage(), e);
                m.setConnectivityNumber(-1);
                m.setConnectivityCalculationMethod(null);
            }
            
            // Scattering number hesapla (aynı hazır graph data ile)
            try {
                int totalNodes = graphData.allNodes.size();
                String method = totalNodes > 30 ? "HEURISTIC" : "EXACT";
                double scatteringNumber = scatteringService.calculateScatteringNumber(graphData);
                m.setScatteringNumber(scatteringNumber);
                m.setScatteringCalculationMethod(method);
                logger.info("Scattering number calculated: {} (method: {})", scatteringNumber, method);
            } catch (Exception e) {
                logger.warn("Failed to calculate scattering number: {}", e.getMessage(), e);
                m.setScatteringNumber(-1.0);
                m.setScatteringCalculationMethod(null);
            }
            
            // Rupture number hesapla (aynı hazır graph data ile)
            // Not: Rupture service her zaman heuristic algoritma kullanır
            try {
                double ruptureNumber = ruptureService.calculateRuptureNumber(graphData);
                m.setRuptureNumber(ruptureNumber);
                m.setRuptureCalculationMethod("HEURISTIC"); // Her zaman heuristic
                logger.info("Rupture number calculated: {} (method: HEURISTIC)", ruptureNumber);
            } catch (Exception e) {
                logger.warn("Failed to calculate rupture number: {}", e.getMessage(), e);
                m.setRuptureNumber(-1.0);
                m.setRuptureCalculationMethod(null);
            }
            
            // Integrity number hesapla (aynı hazır graph data ile)
            try {
                int totalNodes = graphData.allNodes.size();
                String method = totalNodes > 30 ? "HEURISTIC" : "EXACT";
                double integrityNumber = integrityService.calculateIntegrityNumber(graphData);
                m.setIntegrityNumber(integrityNumber);
                m.setIntegrityCalculationMethod(method);
                logger.info("Integrity number calculated: {} (method: {})", integrityNumber, method);
            } catch (Exception e) {
                logger.warn("Failed to calculate integrity number: {}", e.getMessage(), e);
                m.setIntegrityNumber(-1.0);
                m.setIntegrityCalculationMethod(null);
            }
            
            // Toughness number hesapla (aynı hazır graph data ile)
            try {
                int totalNodes = graphData.allNodes.size();
                String method = totalNodes > 30 ? "HEURISTIC" : "EXACT";
                double toughnessNumber = toughnessService.calculateToughnessNumber(graphData);
                m.setToughnessNumber(toughnessNumber);
                m.setToughnessCalculationMethod(method);
                logger.info("Toughness number calculated: {} (method: {})", toughnessNumber, method);
            } catch (Exception e) {
                logger.warn("Failed to calculate toughness number: {}", e.getMessage(), e);
                m.setToughnessNumber(-1.0);
                m.setToughnessCalculationMethod(null);
            }
            
            // Domination number hesapla (aynı hazır graph data ile)
            try {
                int dominationNumber = dominationService.calculateDominationNumber(graphData);
                m.setDominationNumber(dominationNumber);
                logger.info("Domination number calculated: {}", dominationNumber);
            } catch (Exception e) {
                logger.warn("Failed to calculate domination number: {}", e.getMessage(), e);
                m.setDominationNumber(-1);
            }
            
            // 2-Vertex Cover hesapla (aynı hazır graph data ile)
            try {
                GraphTwoVertexCoverService.TwoVertexCoverResult result = 
                    twoVertexCoverService.calculateTwoVertexCover(graphData);
                m.setTwoVertexCoverNumber(result.size);
                m.setTwoVertexCoverNodes(result.nodes);
                logger.info("2-Vertex Cover calculated: {} nodes", result.size);
            } catch (Exception e) {
                logger.warn("Failed to calculate 2-vertex cover: {}", e.getMessage(), e);
                m.setTwoVertexCoverNumber(-1);
                m.setTwoVertexCoverNodes(new ArrayList<>());
            }
        } else {
            // Fallback: Eski yöntemle hesapla (backward compatibility)
            try {
                int connectivityNumber = connectivityService.calculateConnectivityNumber(vertices, edges);
                m.setConnectivityNumber(connectivityNumber);
            } catch (Exception e) {
                m.setConnectivityNumber(-1);
            }
        }
        
        return m;
    }
}


