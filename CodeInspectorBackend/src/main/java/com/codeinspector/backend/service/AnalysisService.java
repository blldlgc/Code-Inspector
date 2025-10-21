package com.codeinspector.backend.service;

import com.codeinspector.backend.model.AnalysisResult;
import com.codeinspector.backend.model.Project;
import com.codeinspector.backend.model.ProjectVersion;
import com.codeinspector.backend.repository.AnalysisResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AnalysisService {

    private final AnalysisResultRepository analysisResultRepository;
    private final ProjectVersionService versionService;
    
    // Diğer analiz servisleri (CodeMetricsAnalyzer, CodeSmellAnalyzer, vb.)
    // Bu servisler mock olarak tanımlanabilir veya mevcut servisler kullanılabilir
    
    @Autowired
    public AnalysisService(
            AnalysisResultRepository analysisResultRepository,
            ProjectVersionService versionService) {
        this.analysisResultRepository = analysisResultRepository;
        this.versionService = versionService;
    }

    /**
     * Belirli bir versiyon için analiz yapar ve sonuçları kaydeder
     */
    @Transactional
    public AnalysisResult analyzeVersion(Project project, ProjectVersion version, String analysisType) throws Exception {
        // Önce versiyonu checkout yap
        versionService.checkoutVersion(project, version.getId());
        
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
     * Not: Bu metot gerçek analiz servislerine bağlanacak şekilde genişletilebilir
     */
    private String performAnalysis(Project project, String analysisType) {
        // Bu kısım mock olarak tanımlanmıştır, gerçek implementasyonda ilgili analiz servisleri çağrılacaktır
        switch (analysisType) {
            case "code-quality":
                return mockCodeQualityAnalysis(project);
            case "security":
                return mockSecurityAnalysis(project);
            case "coverage":
                return mockCoverageAnalysis(project);
            case "code-smell":
                return mockCodeSmellAnalysis(project);
            default:
                throw new IllegalArgumentException("Unknown analysis type: " + analysisType);
        }
    }

    // Mock analiz metotları
    // Gerçek implementasyonda bu metotlar ilgili analiz servislerine bağlanacaktır

    private String mockCodeQualityAnalysis(Project project) {
        return """
            {
                "quality_score": 85,
                "metrics": {
                    "maintainability": 80,
                    "reliability": 90,
                    "security": 85
                },
                "issues": [
                    {
                        "file": "src/main/java/com/example/App.java",
                        "line": 42,
                        "message": "Method too complex, consider refactoring",
                        "severity": "MAJOR"
                    }
                ]
            }
            """;
    }

    private String mockSecurityAnalysis(Project project) {
        return """
            {
                "security_score": 75,
                "vulnerabilities": [
                    {
                        "file": "src/main/java/com/example/SecurityConfig.java",
                        "line": 23,
                        "message": "Weak encryption algorithm",
                        "severity": "CRITICAL"
                    }
                ]
            }
            """;
    }

    private String mockCoverageAnalysis(Project project) {
        return """
            {
                "overall_coverage": 68.5,
                "line_coverage": 72.3,
                "branch_coverage": 64.7,
                "files": [
                    {
                        "file": "src/main/java/com/example/Service.java",
                        "line_coverage": 85.2,
                        "branch_coverage": 76.1
                    }
                ]
            }
            """;
    }

    private String mockCodeSmellAnalysis(Project project) {
        return """
            {
                "total_smells": 12,
                "smells": [
                    {
                        "file": "src/main/java/com/example/Repository.java",
                        "line": 57,
                        "message": "Long method, consider extracting parts into separate methods",
                        "severity": "MEDIUM"
                    }
                ]
            }
            """;
    }
}
