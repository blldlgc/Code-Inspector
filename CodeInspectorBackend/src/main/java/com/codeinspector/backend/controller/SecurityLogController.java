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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class SecurityLogController {

    private final SecurityLogService securityLogService;

    // Yorum: Tüm security logları getir (pagination ile)
    @GetMapping("/security-logs")
    public ResponseEntity<Page<SecurityLog>> getSecurityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SecurityLog> logs = securityLogService.getLogs(pageable);
        return ResponseEntity.ok(logs);
    }

    // Yorum: Event type'a göre filtrele
    @GetMapping("/security-logs/event-type/{eventType}")
    public ResponseEntity<Page<SecurityLog>> getLogsByEventType(
            @PathVariable String eventType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SecurityLog> logs = securityLogService.getLogsByEventType(eventType, pageable);
        return ResponseEntity.ok(logs);
    }

    // Yorum: Kullanıcıya göre filtrele
    @GetMapping("/security-logs/user/{userId}")
    public ResponseEntity<Page<SecurityLog>> getLogsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SecurityLog> logs = securityLogService.getLogsByUser(userId, pageable);
        return ResponseEntity.ok(logs);
    }

    // Yorum: Son 24 saatteki loglar
    @GetMapping("/security-logs/recent")
    public ResponseEntity<List<SecurityLog>> getRecentLogs() {
        List<SecurityLog> logs = securityLogService.getRecentLogs();
        return ResponseEntity.ok(logs);
    }

    // Yorum: Log istatistikleri
    @GetMapping("/security-logs/stats")
    public ResponseEntity<Map<String, Object>> getLogStats() {
        Map<String, Object> stats = securityLogService.getLogStats();
        return ResponseEntity.ok(stats);
    }
}
