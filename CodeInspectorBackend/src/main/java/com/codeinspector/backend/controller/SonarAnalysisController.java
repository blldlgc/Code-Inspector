package com.codeinspector.backend.controller;

import com.codeinspector.backend.dto.SonarAnalysisRequest;
import com.codeinspector.backend.dto.SonarAnalysisResult;
import com.codeinspector.backend.service.SonarQubeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sonar")
@CrossOrigin(origins = "http://localhost:5173") // React uygulamanızın çalıştığı port
@RequiredArgsConstructor
public class SonarAnalysisController {

    private final SonarQubeService sonarQubeService;

    @PostMapping("/analyze")
    public SonarAnalysisResult analyzecode(@RequestBody SonarAnalysisRequest request) {
        return sonarQubeService.analyzeProject(request.getSourceCode(), request.getProjectKey());
    }
}