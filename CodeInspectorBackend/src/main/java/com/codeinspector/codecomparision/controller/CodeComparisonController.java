package com.codeinspector.codecomparision.controller;

import com.codeinspector.codecomparision.dto.CodeComparisonRequest;
import com.codeinspector.codecomparision.dto.CodeComparisonResponse;
import com.codeinspector.codecomparision.service.CodeComparisonService;
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