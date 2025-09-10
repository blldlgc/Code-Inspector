package com.codeinspector.backend.controller;

import com.codeinspector.backend.dto.UserDTO;
import com.codeinspector.backend.model.User;
import com.codeinspector.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUser(id));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(adminService.updateUser(id, userDTO));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/system-health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        return ResponseEntity.ok(adminService.getSystemHealth());
    }

    @GetMapping("/security-logs")
    public ResponseEntity<List<Map<String, Object>>> getSecurityLogs() {
        return ResponseEntity.ok(adminService.getSecurityLogs());
    }
}