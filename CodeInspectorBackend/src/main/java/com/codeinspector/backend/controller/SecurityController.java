package com.codeinspector.backend.controller;

import com.codeinspector.backend.dto.CodeSmellRequest;
import com.codeinspector.backend.dto.SecurityAnalysisResult;
import com.codeinspector.backend.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/security")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class SecurityController {

    private final SecurityService securityService;

    @PostMapping("/analyze")
    public SecurityAnalysisResult analyzeCodeSecurity(@RequestBody CodeSmellRequest request) {
        return securityService.analyzeCode(request.getSourceCode());
    }
} 