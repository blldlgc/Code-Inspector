package com.codeinspector.backend.service;

import com.codeinspector.backend.dto.CodeAnalysisResult;
import com.codeinspector.backend.dto.CodeMetricsResponse;
import com.codeinspector.backend.dto.CoverageResult;
import com.codeinspector.backend.dto.GraphResponse;
import com.codeinspector.backend.dto.SecurityAnalysisResult;
import com.codeinspector.backend.model.AnalysisResult;
import com.codeinspector.backend.model.Project;
import com.codeinspector.backend.model.ProjectVersion;
import com.codeinspector.backend.repository.AnalysisResultRepository;
import com.codeinspector.backend.utils.CodeMetricsAnalyzer;
import com.codeinspector.backend.utils.CodeSmellAnalyzer;
import com.codeinspector.backend.utils.InMemoryCoverageAnalyzer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class AnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(AnalysisService.class);

    private final AnalysisResultRepository analysisResultRepository;
    private final ProjectVersionService versionService;
    private final ProjectAnalysisService projectAnalysisService;
    private final CodeMetricsAnalyzer codeMetricsAnalyzer;
    private final CodeComparisonService codeComparisonService;
    private final CodeGraphService codeGraphService;
    private final SecurityService securityService;
    private final ProjectCoverageService projectCoverageService;
    private final ObjectMapper objectMapper;
    
    @Autowired
    public AnalysisService(
            AnalysisResultRepository analysisResultRepository,
            ProjectVersionService versionService,
            ProjectAnalysisService projectAnalysisService,
            CodeMetricsAnalyzer codeMetricsAnalyzer,
            CodeComparisonService codeComparisonService,
            CodeGraphService codeGraphService,
            SecurityService securityService,
            ProjectCoverageService projectCoverageService,
            ObjectMapper objectMapper) {
        this.analysisResultRepository = analysisResultRepository;
        this.versionService = versionService;
        this.projectAnalysisService = projectAnalysisService;
        this.codeMetricsAnalyzer = codeMetricsAnalyzer;
        this.codeComparisonService = codeComparisonService;
        this.codeGraphService = codeGraphService;
        this.securityService = securityService;
        this.projectCoverageService = projectCoverageService;
        this.objectMapper = objectMapper;
    }

    /**
     * Belirli bir versiyon için tek bir analiz yapar ve sonucu kaydeder
     */
    @Transactional
    public AnalysisResult analyzeVersion(Project project, ProjectVersion version, String analysisType) throws Exception {
        // Önce versiyonu checkout yap
        versionService.checkoutVersion(project, version.getId());
        return runSingleAnalysis(project, version, analysisType);
    }

    /**
     * Belirli bir versiyon için tüm analiz tiplerini (code-quality, security, coverage, code-smell,
     * clone-detection, code-graph, metrics) sırayla çalıştırır ve sonuçları map olarak döner.
     *
     * Not: Versiyon checkout işlemi yalnızca bir kez yapılır.
     */
    @Transactional
    public Map<String, AnalysisResult> runAllAnalyses(Project project, ProjectVersion version) throws Exception {
        logger.info("Running all analyses for project: {}, version: {}", project.getSlug(), version.getId());

        // Versiyonu bir kez checkout et
        versionService.checkoutVersion(project, version.getId());

        Map<String, AnalysisResult> results = new HashMap<>();
        String[] analysisTypes = new String[] {
                "code-quality",
                "security",
                "coverage",
                "code-smell",
                "clone-detection",
                "code-graph",
                "metrics"
        };

        for (String analysisType : analysisTypes) {
            try {
                AnalysisResult result = runSingleAnalysis(project, version, analysisType);
                results.put(analysisType, result);
            } catch (Exception e) {
                // Bir analiz başarısız olsa bile diğerlerini çalıştırmaya devam et
                logger.error("Error running analysis type: {} for project: {}, version: {}",
                        analysisType, project.getSlug(), version.getId(), e);
            }
        }

        return results;
    }

    /**
     * Tek bir analiz tipini çalıştırır ve sonucu veritabanına yazar.
     * Hem tekil analiz endpoint'i hem de run-all için ortak kullanılır.
     */
    private AnalysisResult runSingleAnalysis(Project project, ProjectVersion version, String analysisType) throws Exception {
        // Analiz tipine göre ilgili analiz servisini çağır
        String resultData = performAnalysis(project, analysisType);

        // Mevcut analiz sonucunu kontrol et
        Optional<AnalysisResult> existingResult = analysisResultRepository.findByVersionIdAndType(
                version.getId(), analysisType);

        if (existingResult.isPresent()) {
            // Mevcut sonucu güncelle
            AnalysisResult result = existingResult.get();
            result.setResultData(resultData);
            return analysisResultRepository.save(result);
        } else {
            // Yeni sonuç oluştur
            AnalysisResult result = new AnalysisResult();
            result.setProjectVersion(version);
            result.setAnalysisType(analysisType);
            result.setResultData(resultData);
            return analysisResultRepository.save(result);
        }
    }

    /**
     * Belirli bir versiyon için tüm analiz sonuçlarını getirir
     */
    public List<AnalysisResult> getResultsForVersion(Long versionId) {
        return analysisResultRepository.findByProjectVersionId(versionId);
    }

    /**
     * Analiz tipine göre ilgili analiz servisini çağırır
     * Projedeki tüm Java dosyalarını analiz eder
     */
    private String performAnalysis(Project project, String analysisType) throws Exception {
        logger.info("Performing analysis type: {} for project: {}", analysisType, project.getSlug());
        
        // Projedeki tüm Java dosyalarını bul
        List<ProjectAnalysisService.JavaFileInfo> javaFiles = projectAnalysisService.findJavaFiles(project.getSlug());
        
        if (javaFiles.isEmpty()) {
            logger.warn("No Java files found in project: {}", project.getSlug());
            return objectMapper.writeValueAsString(Map.of("error", "No Java files found in project"));
        }
        
        try {
            switch (analysisType) {
                case "code-quality":
                    return performCodeQualityAnalysis(project, javaFiles);
                case "security":
                    return performSecurityAnalysis(project, javaFiles);
                case "coverage":
                    return performCoverageAnalysis(project, javaFiles);
                case "code-smell":
                    return performCodeSmellAnalysis(project, javaFiles);
                case "metrics":
                    return performMetricsAnalysis(project, javaFiles);
                case "code-graph":
                    return performCodeGraphAnalysis(project, javaFiles);
                case "clone-detection":
                    return performCloneDetectionAnalysis(project, javaFiles);
                default:
                    throw new IllegalArgumentException("Unknown analysis type: " + analysisType);
            }
        } catch (Exception e) {
            logger.error("Error performing analysis type: {} for project: {}", analysisType, project.getSlug(), e);
            return objectMapper.writeValueAsString(Map.of("error", "Analysis failed: " + e.getMessage()));
        }
    }

    /**
     * Code Quality analizi: Metrics + Code Smell
     */
    private String performCodeQualityAnalysis(Project project, List<ProjectAnalysisService.JavaFileInfo> javaFiles) throws Exception {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> files = new ArrayList<>();
        double totalQualityScore = 0;
        int analyzedFiles = 0;

        for (ProjectAnalysisService.JavaFileInfo fileInfo : javaFiles) {
            try {
                String code = projectAnalysisService.readJavaFile(project.getSlug(), fileInfo.relativePath());
                
                // Metrics analizi
                Map<String, String> metrics = codeMetricsAnalyzer.analyzeMetrics(code);
                
                // Code Smell analizi
                CodeSmellAnalyzer codeSmellAnalyzer = new CodeSmellAnalyzer();
                CodeAnalysisResult smellResult = codeSmellAnalyzer.analyzeCode(code);
                
                Map<String, Object> fileResult = new HashMap<>();
                fileResult.put("filePath", fileInfo.relativePath());
                fileResult.put("metrics", metrics);
                fileResult.put("codeSmell", Map.of(
                    "overallScore", smellResult.getOverallScore(),
                    "smellScores", smellResult.getSmellScores(),
                    "smellDetails", smellResult.getSmellDetails()
                ));
                
                files.add(fileResult);
                totalQualityScore += smellResult.getOverallScore();
                analyzedFiles++;
            } catch (Exception e) {
                logger.warn("Error analyzing file: {}", fileInfo.relativePath(), e);
            }
        }

        result.put("files", files);
        result.put("averageQualityScore", analyzedFiles > 0 ? totalQualityScore / analyzedFiles : 0);
        result.put("totalFiles", javaFiles.size());
        result.put("analyzedFiles", analyzedFiles);
        
        return objectMapper.writeValueAsString(result);
    }

    /**
     * Security analizi
     */
    private String performSecurityAnalysis(Project project, List<ProjectAnalysisService.JavaFileInfo> javaFiles) throws Exception {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> files = new ArrayList<>();
        AtomicInteger totalVulnerabilities = new AtomicInteger(0);
        Map<String, Integer> severityCount = new HashMap<>();

        for (ProjectAnalysisService.JavaFileInfo fileInfo : javaFiles) {
            try {
                String code = projectAnalysisService.readJavaFile(project.getSlug(), fileInfo.relativePath());
                SecurityAnalysisResult securityResult = securityService.analyzeCode(code);
                
                Map<String, Object> fileResult = new HashMap<>();
                fileResult.put("filePath", fileInfo.relativePath());
                fileResult.put("vulnerabilities", securityResult.vulnerabilities());
                fileResult.put("recommendations", securityResult.recommendations());
                fileResult.put("riskMetrics", securityResult.riskMetrics());
                
                files.add(fileResult);
                
                // Severity sayılarını topla
                securityResult.vulnerabilities().forEach((severity, issues) -> {
                    severityCount.put(severity, severityCount.getOrDefault(severity, 0) + issues.size());
                    totalVulnerabilities.addAndGet(issues.size());
                });
            } catch (Exception e) {
                logger.warn("Error analyzing security for file: {}", fileInfo.relativePath(), e);
            }
        }

        result.put("files", files);
        result.put("totalVulnerabilities", totalVulnerabilities.get());
        result.put("severityCount", severityCount);
        
        return objectMapper.writeValueAsString(result);
    }

    /**
     * Code Smell analizi
     */
    private String performCodeSmellAnalysis(Project project, List<ProjectAnalysisService.JavaFileInfo> javaFiles) throws Exception {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> files = new ArrayList<>();
        double totalScore = 0;
        int analyzedFiles = 0;

        for (ProjectAnalysisService.JavaFileInfo fileInfo : javaFiles) {
            try {
                String code = projectAnalysisService.readJavaFile(project.getSlug(), fileInfo.relativePath());
                CodeSmellAnalyzer codeSmellAnalyzer = new CodeSmellAnalyzer();
                CodeAnalysisResult smellResult = codeSmellAnalyzer.analyzeCode(code);
                
                Map<String, Object> fileResult = new HashMap<>();
                fileResult.put("filePath", fileInfo.relativePath());
                fileResult.put("overallScore", smellResult.getOverallScore());
                fileResult.put("smellScores", smellResult.getSmellScores());
                fileResult.put("smellDetails", smellResult.getSmellDetails());
                
                files.add(fileResult);
                totalScore += smellResult.getOverallScore();
                analyzedFiles++;
            } catch (Exception e) {
                logger.warn("Error analyzing code smell for file: {}", fileInfo.relativePath(), e);
            }
        }

        result.put("files", files);
        result.put("averageScore", analyzedFiles > 0 ? totalScore / analyzedFiles : 0);
        result.put("totalFiles", javaFiles.size());
        result.put("analyzedFiles", analyzedFiles);
        
        return objectMapper.writeValueAsString(result);
    }

    /**
     * Metrics analizi
     */
    private String performMetricsAnalysis(Project project, List<ProjectAnalysisService.JavaFileInfo> javaFiles) throws Exception {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> files = new ArrayList<>();
        Map<String, Double> projectMetrics = new HashMap<>();
        int totalLines = 0;
        int totalMethods = 0;
        int totalClasses = 0;

        for (ProjectAnalysisService.JavaFileInfo fileInfo : javaFiles) {
            try {
                String code = projectAnalysisService.readJavaFile(project.getSlug(), fileInfo.relativePath());
                Map<String, String> metrics = codeMetricsAnalyzer.analyzeMetrics(code);
                
                Map<String, Object> fileResult = new HashMap<>();
                fileResult.put("filePath", fileInfo.relativePath());
                fileResult.put("metrics", metrics);
                
                files.add(fileResult);
                
                // Proje geneli metrikleri topla
                totalLines += Integer.parseInt(metrics.getOrDefault("Lines of Code", "0"));
                totalMethods += Integer.parseInt(metrics.getOrDefault("Number of Methods", "0"));
                totalClasses += Integer.parseInt(metrics.getOrDefault("Number of Classes", "0"));
            } catch (Exception e) {
                logger.warn("Error analyzing metrics for file: {}", fileInfo.relativePath(), e);
            }
        }

        projectMetrics.put("totalLinesOfCode", (double) totalLines);
        projectMetrics.put("totalMethods", (double) totalMethods);
        projectMetrics.put("totalClasses", (double) totalClasses);
        projectMetrics.put("averageComplexity", files.size() > 0 ? 
            files.stream()
                .mapToDouble(f -> Double.parseDouble(((Map<String, String>) f.get("metrics")).getOrDefault("Cyclomatic Complexity", "0")))
                .average()
                .orElse(0) : 0);

        result.put("files", files);
        result.put("projectMetrics", projectMetrics);
        
        return objectMapper.writeValueAsString(result);
    }

    /**
     * Code Graph analizi
     */
    private String performCodeGraphAnalysis(Project project, List<ProjectAnalysisService.JavaFileInfo> javaFiles) throws Exception {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> files = new ArrayList<>();

        for (ProjectAnalysisService.JavaFileInfo fileInfo : javaFiles) {
            try {
                String code = projectAnalysisService.readJavaFile(project.getSlug(), fileInfo.relativePath());
                GraphResponse graphResponse = codeGraphService.analyzeCode(code);
                
                Map<String, Object> fileResult = new HashMap<>();
                fileResult.put("filePath", fileInfo.relativePath());
                fileResult.put("complexity", graphResponse.getComplexity());
                fileResult.put("complexityDetails", graphResponse.getComplexityDetails());
                fileResult.put("rootNode", graphResponse.getRootNode());
                
                files.add(fileResult);
            } catch (Exception e) {
                logger.warn("Error analyzing code graph for file: {}", fileInfo.relativePath(), e);
            }
        }

        result.put("files", files);
        result.put("totalFiles", javaFiles.size());
        
        return objectMapper.writeValueAsString(result);
    }

    /**
     * Clone Detection analizi
     * Not: Bu analiz tüm dosya çiftlerini karşılaştırır, uzun sürebilir
     */
    private String performCloneDetectionAnalysis(Project project, List<ProjectAnalysisService.JavaFileInfo> javaFiles) throws Exception {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> duplicatePairs = new ArrayList<>();
        int totalComparisons = 0;
        double totalSimilarity = 0;

        // Tüm dosya çiftlerini karşılaştır
        for (int i = 0; i < javaFiles.size(); i++) {
            for (int j = i + 1; j < javaFiles.size(); j++) {
                try {
                    String code1 = projectAnalysisService.readJavaFile(project.getSlug(), javaFiles.get(i).relativePath());
                    String code2 = projectAnalysisService.readJavaFile(project.getSlug(), javaFiles.get(j).relativePath());
                    
                    var comparisonResult = codeComparisonService.compareCode(code1, code2);
                    double similarity = comparisonResult.hybridSimilarityPercentage();
                    
                    if (similarity > 50) { // %50'den fazla benzerlik varsa kaydet
                        Map<String, Object> pair = new HashMap<>();
                        pair.put("file1", javaFiles.get(i).relativePath());
                        pair.put("file2", javaFiles.get(j).relativePath());
                        pair.put("similarity", similarity);
                        pair.put("codeBertSimilarity", comparisonResult.codeBertSimilarityScore());
                        pair.put("cpdSimilarity", comparisonResult.CPDsimilarityPercentage());
                        pair.put("simianSimilarity", comparisonResult.simianSimilarityPercentage());
                        duplicatePairs.add(pair);
                    }
                    
                    totalSimilarity += similarity;
                    totalComparisons++;
                } catch (Exception e) {
                    logger.warn("Error comparing files: {} and {}", 
                        javaFiles.get(i).relativePath(), javaFiles.get(j).relativePath(), e);
                }
            }
        }

        result.put("totalFiles", javaFiles.size());
        result.put("totalComparisons", totalComparisons);
        result.put("duplicatePairs", duplicatePairs);
        result.put("averageSimilarity", totalComparisons > 0 ? totalSimilarity / totalComparisons : 0);
        
        return objectMapper.writeValueAsString(result);
    }

    /**
     * Coverage analizi
     * ProjectCoverageService kullanarak proje coverage raporu üretir.
     */
    private String performCoverageAnalysis(Project project, List<ProjectAnalysisService.JavaFileInfo> javaFiles) throws Exception {
        logger.info("Starting coverage analysis for project: {}", project.getSlug());
        Map<String, Object> coverageResult = projectCoverageService.analyzeProjectCoverage(project);
        return objectMapper.writeValueAsString(coverageResult);
    }
}
