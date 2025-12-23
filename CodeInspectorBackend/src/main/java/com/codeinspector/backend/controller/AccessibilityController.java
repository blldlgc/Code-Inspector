package com.codeinspector.backend.controller;

import com.codeinspector.backend.dto.AccessibilitySettingsDTO;
import com.codeinspector.backend.model.User;
import com.codeinspector.backend.service.AccessibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accessibility")
@RequiredArgsConstructor
public class AccessibilityController {

    private final AccessibilityService accessibilityService;

    @GetMapping("/settings")
    public ResponseEntity<AccessibilitySettingsDTO> getSettings() {
        try {
            System.out.println("AccessibilityController - GET /settings called");
            User currentUser = accessibilityService.getCurrentUser();
            System.out.println("AccessibilityController - Current user: " + currentUser.getUsername());
            AccessibilitySettingsDTO settings = accessibilityService.getSettings(currentUser.getId());
            System.out.println("AccessibilityController - Settings retrieved: " + settings);
            return ResponseEntity.ok(settings);
        } catch (IllegalStateException e) {
            System.err.println("AccessibilityController - GET IllegalStateException: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(401).build();
        } catch (IllegalArgumentException e) {
            System.err.println("AccessibilityController - GET IllegalArgumentException: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("AccessibilityController - GET Exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/settings")
    public ResponseEntity<AccessibilitySettingsDTO> updateSettings(@RequestBody AccessibilitySettingsDTO dto) {
        try {
            System.out.println("AccessibilityController - Received DTO: " + dto);
            User currentUser = accessibilityService.getCurrentUser();
            AccessibilitySettingsDTO updated = accessibilityService.updateSettings(currentUser.getId(), dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException e) {
            System.err.println("AccessibilityController - IllegalStateException: " + e.getMessage());
            return ResponseEntity.status(401).build();
        } catch (IllegalArgumentException e) {
            System.err.println("AccessibilityController - IllegalArgumentException: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("AccessibilityController - Exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}


