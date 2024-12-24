package com.codeinspector.backend.controller;

import com.codeinspector.backend.dto.TreeSitterRequest;
import com.codeinspector.backend.dto.TreeSitterResponse;
import com.codeinspector.backend.service.TreeSitterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tree-sitter")
public class TreeSitterController {

    @Autowired
    private TreeSitterService treeSitterService;

    @PostMapping
    public TreeSitterResponse analyzeCode(@RequestBody TreeSitterRequest request) {
        return treeSitterService.analyzeCode(request.getCode());
    }
}
