package com.codeinspector.codecomparison.controller;

import com.codeinspector.codecomparison.dto.CodeComparisonRequest;
import com.codeinspector.codecomparison.dto.CodeComparisonResponse;
import com.codeinspector.codecomparison.service.CodeComparisonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/code")
@CrossOrigin(origins = "http://localhost:3000") // React uygulamanızın çalıştığı port
public class CodeComparisonController {

    @Autowired
    private CodeComparisonService codeComparisonService;

    @PostMapping("/compare")
    public CodeComparisonResponse compareCode(@RequestBody CodeComparisonRequest request) {
        return codeComparisonService.compareCode(request.code1(), request.code2());
    }
}