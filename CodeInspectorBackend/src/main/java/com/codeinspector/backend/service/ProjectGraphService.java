package com.codeinspector.backend.service;

import com.codeinspector.backend.graph.CodeGraphResult;
import com.codeinspector.backend.graph.CodeGraphResult.Edge;
import com.codeinspector.backend.graph.CodeGraphResult.GraphMetrics;
import com.codeinspector.backend.graph.CodeGraphResult.Vertex;
import com.codeinspector.backend.model.Project;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

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
                        parseJavaFile(path, classToMethods, classDeps, projectClasses, simpleNameToFullNames);
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
            logger.debug("Class {} has {} dependencies in classDeps", source, deps.size());
            
            // Source'un vertex olarak eklenmiş olduğundan emin ol
            if (!vertexIds.contains(source)) {
                logger.warn("Source class {} not found in vertices! This should not happen.", source);
                continue;
            }
            
            for (String target : deps) {
                if (!source.equals(target) && projectClasses.contains(target)) {
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
                    logger.debug("Created depends edge: {} -> {}", source, target);
                } else if (!source.equals(target)) {
                    logger.debug("Skipped edge {} -> {} (target not in projectClasses)", source, target);
                }
            }
        }
        logger.info("Created {} depends edges between classes", dependsEdgeCount);
        logger.info("Total edges created: {} ({} depends, {} has)", edges.size(), dependsEdgeCount, edges.size() - dependsEdgeCount);
        
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
        return m;
    }
}


