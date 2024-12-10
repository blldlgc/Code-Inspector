package com.codeinspector.codecomparison.controller;

import com.codeinspector.codecomparison.dto.TreeSitterRequest;
import com.codeinspector.codecomparison.dto.TreeSitterResponse;
import com.codeinspector.codecomparison.service.TreeSitterService;
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
