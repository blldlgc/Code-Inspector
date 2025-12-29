package com.codeinspector.backend.service;

import com.codeinspector.backend.dto.CoverageResult;
import com.codeinspector.backend.model.Project;
import com.codeinspector.backend.service.ProjectAnalysisService.JavaFileInfo;
import com.codeinspector.backend.utils.InMemoryCoverageAnalyzer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Jacoco tabanlı proje coverage servisi.
 *
 * Amaç:
 * - Bir proje versiyonu için (Maven benzeri layout varsayımıyla)
 *   src/main/java ve src/test/java altındaki sınıfların coverage bilgisini üretmek.
 *
 * Not:
 * - InMemoryCoverageAnalyzer'ı kullanarak source + test çiftleri bazında coverage hesaplar.
 * - Her test dosyası için ilgili source dosyasını bulur ve sonuçları proje geneli rapora dönüştürür.
 */
@Service
public class ProjectCoverageService {

    private static final Logger logger = LoggerFactory.getLogger(ProjectCoverageService.class);

    private final ProjectAnalysisService projectAnalysisService;

    @Autowired
    public ProjectCoverageService(ProjectAnalysisService projectAnalysisService) {
        this.projectAnalysisService = projectAnalysisService;
    }

    /**
     * Verilen proje için yüksek seviye coverage raporu üretir.
     *
     * Çıktı yapısı:
     * {
     *   "projectCoverage": 78.5,
     *   "totalLines": 1528,
     *   "coveredLines": 1200,
     *   "files": [ { ... file level coverage ... } ],
     *   "totalTestFiles": 3,
     *   "analyzedPairs": 3,
     *   "failedAnalyses": 0
     * }
     */
    public Map<String, Object> analyzeProjectCoverage(Project project) throws Exception {
        logger.info("Starting project coverage analysis for project: {}", project.getSlug());

        List<JavaFileInfo> javaFiles = projectAnalysisService.findJavaFiles(project.getSlug());
        if (javaFiles.isEmpty()) {
            logger.warn("No Java files found in project: {}", project.getSlug());
            Map<String, Object> result = new HashMap<>();
            result.put("error", "No Java files found");
            result.put("message", "Coverage analysis requires Java source and test files");
            return result;
        }

        // Test dosyalarını bul (*Test.java, *Tests.java pattern)
        // Test dosyaları genelde test/ klasöründe veya isimlerinde Test/Tests içerir
        List<JavaFileInfo> testFiles = javaFiles.stream()
                .filter(f -> {
                    String filePath = f.relativePath();
                    String fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
                    String lowerPath = filePath.toLowerCase();
                    String lowerName = fileName.toLowerCase();

                    // Test klasöründe olan veya Test/Tests/TestsCase ile biten dosyalar
                    return (lowerPath.contains("/test/") ||
                            lowerName.endsWith("test.java") ||
                            lowerName.endsWith("tests.java") ||
                            lowerName.endsWith("testcase.java")) &&
                            !lowerPath.contains("/main/java/"); // main klasöründeki dosyaları test olarak sayma
                })
                .collect(Collectors.toList());

        if (testFiles.isEmpty()) {
            logger.warn("No test files found for coverage analysis in project: {}", project.getSlug());
            Map<String, Object> result = new HashMap<>();
            result.put("error", "No test files found");
            result.put("message", "Coverage analysis requires test files (*Test.java or *Tests.java)");
            result.put("totalFiles", javaFiles.size());
            return result;
        }

        logger.info("Found {} test files for project coverage analysis", testFiles.size());

        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> fileCoverages = new ArrayList<>();
        double totalCoverage = 0;
        int totalCoveredLines = 0;
        int totalLines = 0;
        int analyzedPairs = 0;
        int failedAnalyses = 0;

        // Her test dosyası için ilgili source dosyasını bul ve analiz et
        for (JavaFileInfo testFile : testFiles) {
            String sourceFileName = null;
            try {
                // Test dosyası adından source dosya adını çıkar
                // Örnek: UserServiceTest.java -> UserService.java
                String testFileName = testFile.relativePath();
                sourceFileName = findSourceFileForTest(testFileName, javaFiles);

                if (sourceFileName == null) {
                    logger.warn("Could not find source file for test: {}", testFileName);
                    failedAnalyses++;
                    continue;
                }

                logger.debug("Analyzing coverage: test={}, source={}", testFileName, sourceFileName);

                // Dosyaları oku
                String testCode = projectAnalysisService.readJavaFile(project.getSlug(), testFileName);
                String sourceCode = projectAnalysisService.readJavaFile(project.getSlug(), sourceFileName);

                // Dosya içeriklerini kontrol et
                if (testCode == null || testCode.trim().isEmpty()) {
                    throw new RuntimeException("Test file is empty or could not be read");
                }
                if (sourceCode == null || sourceCode.trim().isEmpty()) {
                    throw new RuntimeException("Source file is empty or could not be read");
                }

                // Class adlarının varlığını kontrol et
                if (!testCode.contains("public class") && !testCode.contains("class")) {
                    throw new RuntimeException("Test file does not contain a class definition");
                }
                if (!sourceCode.contains("public class") && !sourceCode.contains("class")) {
                    throw new RuntimeException("Source file does not contain a class definition");
                }

                logger.debug("File contents read - Test: {} chars, Source: {} chars",
                        testCode.length(), sourceCode.length());

                // Tüm source dosyalarını bağımlılık olarak topla (test dosyaları hariç)
                // Map: dosya yolu (relative path) -> içerik
                Map<String, String> dependencyFiles = new HashMap<>();
                for (JavaFileInfo javaFile : javaFiles) {
                    String filePath = javaFile.relativePath();
                    String lowerPath = filePath.toLowerCase();
                    
                    // Test dosyası değilse ve analiz edilen source dosyası değilse bağımlılık olarak ekle
                    if (!lowerPath.contains("/test/") && 
                        !filePath.equals(sourceFileName) &&
                        !filePath.equals(testFileName)) {
                        try {
                            String depContent = projectAnalysisService.readJavaFile(project.getSlug(), filePath);
                            if (depContent != null && !depContent.trim().isEmpty()) {
                                // Dosya yolunu (relative path) kullan - package yapısını korumak için
                                dependencyFiles.put(filePath, depContent);
                                logger.debug("Dependency file added: {}", filePath);
                            }
                        } catch (Exception e) {
                            logger.warn("Could not read dependency file: {}", filePath, e);
                            // Bağımlılık dosyası okunamazsa devam et, kritik değil
                        }
                    }
                }
                
                logger.info("Collected {} dependency files for coverage analysis", dependencyFiles.size());

                // Coverage analizi yap - bağımlılıklarla birlikte
                InMemoryCoverageAnalyzer coverageAnalyzer = new InMemoryCoverageAnalyzer();
                CoverageResult coverageResult;
                try {
                    coverageResult = coverageAnalyzer.analyzeCoverageWithDependencies(
                            sourceCode, testCode, dependencyFiles);
                } catch (RuntimeException e) {
                    logger.error("InMemoryCoverageAnalyzer error for test: {}, source: {}",
                            testFileName, sourceFileName, e);
                    if (e.getCause() != null) {
                        logger.error("Root cause: {}", e.getCause().getMessage(), e.getCause());
                    }
                    throw e;
                }

                // Sonuçları kaydet
                Map<String, Object> fileCoverage = new HashMap<>();
                fileCoverage.put("sourceFile", sourceFileName);
                fileCoverage.put("testFile", testFileName);
                fileCoverage.put("coveragePercentage", coverageResult.getCoveragePercentage());
                fileCoverage.put("coveredLines", coverageResult.getCoveredLines());
                fileCoverage.put("totalLines", coverageResult.getTotalLines());
                fileCoverage.put("methodCoverage", coverageResult.getMethodCoverage());

                fileCoverages.add(fileCoverage);

                totalCoverage += coverageResult.getCoveragePercentage();
                totalCoveredLines += coverageResult.getCoveredLines();
                totalLines += coverageResult.getTotalLines();
                analyzedPairs++;

                logger.info("Coverage analysis completed for {}: {}%",
                        sourceFileName, coverageResult.getCoveragePercentage());

            } catch (Exception e) {
                logger.error("Error analyzing coverage for test file: {}", testFile.relativePath(), e);
                failedAnalyses++;

                // Hata bilgisini kaydet (daha detaylı)
                Map<String, Object> errorInfo = new HashMap<>();
                errorInfo.put("testFile", testFile.relativePath());
                errorInfo.put("sourceFile", sourceFileName != null ? sourceFileName : "not found");

                // Asıl hatayı bul (nested exception varsa)
                Throwable rootCause = e;
                while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
                    rootCause = rootCause.getCause();
                }

                errorInfo.put("error", rootCause.getMessage() != null ? rootCause.getMessage() : e.getMessage());
                errorInfo.put("errorType", e.getClass().getSimpleName());
                errorInfo.put("rootCauseType", rootCause.getClass().getSimpleName());

                // Stack trace'in ilk satırını ekle (daha fazla bilgi için)
                if (e.getStackTrace().length > 0) {
                    errorInfo.put("errorLocation", e.getStackTrace()[0].toString());
                }

                // Root cause'un ilk satırını da ekle
                if (rootCause.getStackTrace().length > 0) {
                    errorInfo.put("rootCauseLocation", rootCause.getStackTrace()[0].toString());
                }

                fileCoverages.add(errorInfo);
            }
        }

        // Proje geneli özet
        result.put("files", fileCoverages);
        result.put("totalTestFiles", testFiles.size());
        result.put("analyzedPairs", analyzedPairs);
        result.put("failedAnalyses", failedAnalyses);

        if (analyzedPairs > 0) {
            double averageCoverage = totalCoverage / analyzedPairs;
            result.put("overallCoverage", averageCoverage);
            result.put("totalCoveredLines", totalCoveredLines);
            result.put("totalLines", totalLines);
            result.put("projectCoveragePercentage",
                    totalLines > 0 ? (totalCoveredLines * 100.0 / totalLines) : 0);
        } else {
            result.put("overallCoverage", 0.0);
            result.put("totalCoveredLines", 0);
            result.put("totalLines", 0);
            result.put("projectCoveragePercentage", 0.0);
        }

        logger.info("Project coverage analysis completed: {} pairs analyzed, overall coverage: {}%",
                analyzedPairs, analyzedPairs > 0 ? totalCoverage / analyzedPairs : 0);

        return result;
    }

    /**
     * Test dosyası için ilgili source dosyasını bulur
     * Örnek: UserServiceTest.java -> UserService.java
     */
    private String findSourceFileForTest(String testFilePath, List<JavaFileInfo> javaFiles) {
        // Test dosya adından class adını çıkar
        String testFileName = testFilePath.substring(testFilePath.lastIndexOf('/') + 1);

        // Test, Tests, TestCase gibi suffix'leri kaldır
        String sourceClassName = testFileName
                .replace("Test.java", "")
                .replace("Tests.java", "")
                .replace("TestCase.java", "")
                .replace(".java", "");

        if (sourceClassName.isEmpty()) {
            return null;
        }

        // Source dosyasını bul (test klasöründe olmayan, aynı class adına sahip)
        return javaFiles.stream()
                .filter(f -> {
                    String filePath = f.relativePath();
                    String fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
                    String lowerPath = filePath.toLowerCase();
                    String lowerName = fileName.toLowerCase();

                    // Test dosyası değil (test klasöründe değil, isminde test yok) ve class adı eşleşiyor
                    return !lowerPath.contains("/test/") &&
                            !lowerName.contains("test") &&
                            fileName.equals(sourceClassName + ".java");
                })
                .map(JavaFileInfo::relativePath)
                .findFirst()
                .orElse(null);
    }
}



