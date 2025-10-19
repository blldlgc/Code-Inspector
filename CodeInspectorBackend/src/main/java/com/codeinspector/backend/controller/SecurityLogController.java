package com.codeinspector.backend.controller;

import com.codeinspector.backend.model.SecurityLog;
import com.codeinspector.backend.service.SecurityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security-logs")
@RequiredArgsConstructor
public class SecurityLogController {

    private final SecurityLogService securityLogService;

    // Yorum: Tüm security logları getir (pagination ile)
    @GetMapping("")
    public ResponseEntity<Page<SecurityLog>> getSecurityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SecurityLog> logs = securityLogService.getLogs(pageable);
        return ResponseEntity.ok(logs);
    }

    // Yorum: Event type'a göre filtrele
    @GetMapping("/event-type/{eventType}")
    public ResponseEntity<Page<SecurityLog>> getLogsByEventType(
            @PathVariable String eventType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SecurityLog> logs = securityLogService.getLogsByEventType(eventType, pageable);
        return ResponseEntity.ok(logs);
    }

    // Yorum: Kullanıcıya göre filtrele
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<SecurityLog>> getLogsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SecurityLog> logs = securityLogService.getLogsByUser(userId, pageable);
        return ResponseEntity.ok(logs);
    }

    // Yorum: Son 24 saatteki loglar
    @GetMapping("/recent")
    public ResponseEntity<List<SecurityLog>> getRecentLogs() {
        List<SecurityLog> logs = securityLogService.getRecentLogs();
        return ResponseEntity.ok(logs);
    }

    // Yorum: Log istatistikleri
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getLogStats() {
        Map<String, Object> stats = securityLogService.getLogStats();
        return ResponseEntity.ok(stats);
    }
}
