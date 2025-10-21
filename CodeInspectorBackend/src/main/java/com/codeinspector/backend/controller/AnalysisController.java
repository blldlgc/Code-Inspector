package com.codeinspector.backend.controller;

import com.codeinspector.backend.model.AnalysisResult;
import com.codeinspector.backend.model.Project;
import com.codeinspector.backend.model.ProjectVersion;
import com.codeinspector.backend.service.AnalysisService;
import com.codeinspector.backend.service.ProjectService;
import com.codeinspector.backend.service.ProjectVersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{slug}/versions/{versionId}/analysis")
public class AnalysisController {

    private final ProjectService projectService;
    private final ProjectVersionService versionService;
    private final AnalysisService analysisService;

    @Autowired
    public AnalysisController(
            ProjectService projectService,
            ProjectVersionService versionService,
            AnalysisService analysisService) {
        this.projectService = projectService;
        this.versionService = versionService;
        this.analysisService = analysisService;
    }

    /**
     * Belirli bir versiyon için tüm analiz sonuçlarını getirir
     */
    @GetMapping
    public ResponseEntity<List<AnalysisResult>> getAnalysisResults(
            @PathVariable String slug,
            @PathVariable Long versionId) {
        
        Project project = projectService.getBySlug(slug);
        if (project == null) return ResponseEntity.notFound().build();
        
        ProjectVersion version = versionService.getVersion(versionId);
        if (version == null || !version.getProject().getId().equals(project.getId())) {
            return ResponseEntity.notFound().build();
        }
        
        List<AnalysisResult> results = analysisService.getResultsForVersion(versionId);
        return ResponseEntity.ok(results);
    }

    /**
     * Belirli bir versiyon için analiz yapar
     */
    @PostMapping
    public ResponseEntity<AnalysisResult> analyzeVersion(
            @PathVariable String slug,
            @PathVariable Long versionId,
            @RequestParam String analysisType) throws Exception {
        
        Project project = projectService.getBySlug(slug);
        if (project == null) return ResponseEntity.notFound().build();
        
        ProjectVersion version = versionService.getVersion(versionId);
        if (version == null || !version.getProject().getId().equals(project.getId())) {
            return ResponseEntity.notFound().build();
        }
        
        AnalysisResult result = analysisService.analyzeVersion(project, version, analysisType);
        return ResponseEntity.ok(result);
    }

    /**
     * Belirli bir analiz sonucunu getirir
     */
    @GetMapping("/{analysisType}")
    public ResponseEntity<AnalysisResult> getAnalysisResult(
            @PathVariable String slug,
            @PathVariable Long versionId,
            @PathVariable String analysisType) {
        
        Project project = projectService.getBySlug(slug);
        if (project == null) return ResponseEntity.notFound().build();
        
        ProjectVersion version = versionService.getVersion(versionId);
        if (version == null || !version.getProject().getId().equals(project.getId())) {
            return ResponseEntity.notFound().build();
        }
        
        AnalysisResult result = analysisService.getResultsForVersion(versionId).stream()
                .filter(r -> r.getAnalysisType().equals(analysisType))
                .findFirst()
                .orElse(null);
        
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(result);
    }
}
