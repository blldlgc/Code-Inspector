package com.codeinspector.backend.service;

import com.codeinspector.backend.model.Project;
import com.codeinspector.backend.model.ProjectVersion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * Proje versiyonlarındaki Java dosyalarını analiz etmek için servis
 * Tüm analiz tiplerini (clone detection, code graph, coverage, code smell, security, metrics) çalıştırır
 */
@Service
public class ProjectAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(ProjectAnalysisService.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max dosya boyutu
    private static final int MAX_FILE_READ_SIZE = 5 * 1024 * 1024; // 5MB max okuma boyutu

    private final ProjectStorageService storageService;
    private final CodeComparisonService codeComparisonService;
    private final CodeGraphService codeGraphService;
    private final SecurityService securityService;
    private final com.codeinspector.backend.utils.CodeMetricsAnalyzer codeMetricsAnalyzer;

    @Autowired
    public ProjectAnalysisService(
            ProjectStorageService storageService,
            CodeComparisonService codeComparisonService,
            CodeGraphService codeGraphService,
            SecurityService securityService,
            com.codeinspector.backend.utils.CodeMetricsAnalyzer codeMetricsAnalyzer) {
        this.storageService = storageService;
        this.codeComparisonService = codeComparisonService;
        this.codeGraphService = codeGraphService;
        this.securityService = securityService;
        this.codeMetricsAnalyzer = codeMetricsAnalyzer;
    }

    /**
     * Java dosya bilgilerini tutan record
     */
    public record JavaFileInfo(String filePath, String relativePath, long size) {}

    /**
     * Proje dizinindeki tüm .java dosyalarını recursive olarak bulur
     * 
     * @param slug Proje slug'ı
     * @return Java dosyalarının listesi
     * @throws IOException Dosya okuma hatası
     */
    public List<JavaFileInfo> findJavaFiles(String slug) throws IOException {
        logger.info("Finding Java files for project: {}", slug);
        
        Path projectDir = storageService.getProjectDirectory(slug);
        if (!Files.exists(projectDir)) {
            logger.warn("Project directory not found: {}", projectDir);
            return new ArrayList<>();
        }

        List<JavaFileInfo> javaFiles = new ArrayList<>();
        
        try (Stream<Path> paths = Files.walk(projectDir)) {
            paths.filter(Files::isRegularFile)
                 .filter(path -> path.toString().endsWith(".java"))
                 .forEach(path -> {
                     try {
                         long size = Files.size(path);
                         
                         // Çok büyük dosyaları atla
                         if (size > MAX_FILE_SIZE) {
                             logger.warn("Skipping large file ({} bytes): {}", size, path);
                             return;
                         }
                         
                         String relativePath = projectDir.relativize(path).toString().replace("\\", "/");
                         javaFiles.add(new JavaFileInfo(path.toString(), relativePath, size));
                     } catch (IOException e) {
                         logger.error("Error getting file size for: {}", path, e);
                     }
                 });
        } catch (IOException e) {
            logger.error("Error walking project directory: {}", projectDir, e);
            throw e;
        }

        logger.info("Found {} Java files in project: {}", javaFiles.size(), slug);
        return javaFiles;
    }

    /**
     * Java dosyasını okur
     * 
     * @param slug Proje slug'ı
     * @param filePath Dosya yolu (relative)
     * @return Dosya içeriği
     * @throws IOException Dosya okuma hatası
     */
    public String readJavaFile(String slug, String filePath) throws IOException {
        logger.debug("Reading Java file: {} in project: {}", filePath, slug);
        
        try {
            return storageService.readTextFile(slug, filePath, MAX_FILE_READ_SIZE);
        } catch (IOException e) {
            logger.error("Error reading Java file: {} in project: {}", filePath, slug, e);
            throw e;
        }
    }

    /**
     * Tüm analizleri çalıştırır (henüz implement edilmedi, sonraki adımda eklenecek)
     * 
     * @param project Proje
     * @param version Proje versiyonu
     * @return Analiz sonuçları map'i
     */
    public java.util.Map<String, Object> runAllAnalyses(Project project, ProjectVersion version) {
        logger.info("Running all analyses for project: {}, version: {}", project.getSlug(), version.getId());
        
        // TODO: İlerleyen adımlarda implement edilecek
        return new java.util.HashMap<>();
    }
}

