package com.codeinspector.codecomparision.controller;

import com.codeinspector.codecomparision.dto.SonarAnalysisRequest;
import com.codeinspector.codecomparision.dto.SonarAnalysisResult;
import com.codeinspector.codecomparision.service.SonarQubeService;
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