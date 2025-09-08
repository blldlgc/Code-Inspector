package com.codeinspector.backend.controller;

import java.util.Arrays;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.codeinspector.backend.dto.CodeComparisonRequest;
import com.codeinspector.backend.dto.CodeComparisonResponse;
import com.codeinspector.backend.dto.CodeMetricsRequest;
import com.codeinspector.backend.dto.CodeMetricsResponse;
import com.codeinspector.backend.dto.CodeGraphRequest;
import com.codeinspector.backend.dto.GraphResponse;
import com.codeinspector.backend.service.CodeComparisonService;
import com.codeinspector.backend.service.CodeGraphService;

@RestController
@RequestMapping("/api/code")
public class CodeComparisonController {

    private final CodeComparisonService codeComparisonService;
    private final CodeGraphService codeGraphService;

    @Autowired
    public CodeComparisonController(
            CodeComparisonService codeComparisonService,

            CodeGraphService codeGraphService) {
        this.codeComparisonService = codeComparisonService;
        this.codeGraphService = codeGraphService;
    }

    //Clone code analizi için controller sınıfı
    @PostMapping("/compare")
    public CodeComparisonResponse compareCode(@RequestBody CodeComparisonRequest request) {
        return codeComparisonService.compareCode(request.code1(), request.code2());
    }

    //Kod metrik analizi için controller sınıfı
    @PostMapping("/metrics")
    public CodeMetricsResponse analyzeMetrics(@RequestBody CodeMetricsRequest request) {
        return codeComparisonService.analyzeMetrics(request.code());
    }

    //Kod graf için controller sınfı
    @PostMapping("/graph")
    public GraphResponse generateGraph(@RequestBody CodeGraphRequest request) {
        return codeGraphService.analyzeCode(request.code());
    }
}