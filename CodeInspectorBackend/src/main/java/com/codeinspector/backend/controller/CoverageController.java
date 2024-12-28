package com.codeinspector.backend.controller;

import com.codeinspector.backend.dto.CoverageRequest;
import com.codeinspector.backend.dto.CoverageResult;
import com.codeinspector.backend.utils.InMemoryCoverageAnalyzer;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/")
@CrossOrigin(origins = "http://localhost:5173")
public class CoverageController {

    @PostMapping("/coverage")
    public ResponseEntity<CoverageResult> analyze(@RequestBody CoverageRequest request) {
        // Burada coverage analizini yapalım
        InMemoryCoverageAnalyzer analyzer = new InMemoryCoverageAnalyzer();
        CoverageResult result = analyzer.analyzeCoverage(
                request.getSourceCode(),
                request.getTestCode()
        );
        return ResponseEntity.ok(result);
    }
}
