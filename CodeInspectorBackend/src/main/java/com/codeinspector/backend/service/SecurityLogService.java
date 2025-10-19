package com.codeinspector.backend.service;

import com.codeinspector.backend.model.SecurityLog;
import com.codeinspector.backend.repository.SecurityLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SecurityLogService {

    private final SecurityLogRepository securityLogRepository;

    // Yorum: Genel log kaydetme metodu
    @Transactional
    public void logEvent(String eventType, Long userId, String username, HttpServletRequest request, Map<String, Object> details) {
        try {
            SecurityLog log = SecurityLog.builder()
                    .eventType(eventType)
                    .userId(userId)
                    .username(username)
                    .ipAddress(getClientIpAddress(request))
                    .userAgent(request != null ? request.getHeader("User-Agent") : null)
                    .details(details != null ? details : new HashMap<>())
                    .createdAt(LocalDateTime.now())
                    .build();

            securityLogRepository.save(log);
        } catch (Exception e) {
            // Yorum: Log kaydetme hatası ana işlemi etkilememeli
            System.err.println("Security log kaydetme hatası: " + e.getMessage());
        }
    }

    // Yorum: Başarılı giriş logu
    public void logLoginSuccess(Long userId, String username, HttpServletRequest request) {
        Map<String, Object> details = new HashMap<>();
        details.put("message", "Kullanıcı başarıyla giriş yaptı");
        logEvent("LOGIN_SUCCESS", userId, username, request, details);
    }

    // Yorum: Başarısız giriş logu
    public void logLoginFailed(String username, HttpServletRequest request, String reason) {
        Map<String, Object> details = new HashMap<>();
        details.put("message", "Başarısız giriş denemesi");
        details.put("reason", reason);
        logEvent("LOGIN_FAILED", null, username, request, details);
    }

    // Yorum: Yeni kullanıcı kaydı logu
    public void logUserCreated(Long userId, String username, HttpServletRequest request) {
        Map<String, Object> details = new HashMap<>();
        details.put("message", "Yeni kullanıcı kaydı oluşturuldu");
        logEvent("USER_CREATED", userId, username, request, details);
    }

    // Yorum: Kullanıcı rolü değişikliği logu
    public void logRoleChanged(Long userId, String username, String oldRole, String newRole, HttpServletRequest request) {
        Map<String, Object> details = new HashMap<>();
        details.put("message", "Kullanıcı rolü değiştirildi");
        details.put("oldRole", oldRole);
        details.put("newRole", newRole);
        logEvent("ROLE_CHANGED", userId, username, request, details);
    }

    // Yorum: Kullanıcı silme logu
    public void logUserDeleted(Long userId, String username, HttpServletRequest request) {
        Map<String, Object> details = new HashMap<>();
        details.put("message", "Kullanıcı silindi");
        logEvent("USER_DELETED", userId, username, request, details);
    }

    // Yorum: Kullanıcı durumu değişikliği logu
    public void logUserStatusChanged(Long userId, String username, boolean oldStatus, boolean newStatus, HttpServletRequest request) {
        Map<String, Object> details = new HashMap<>();
        details.put("message", "Kullanıcı durumu değiştirildi");
        details.put("oldStatus", oldStatus ? "Active" : "Inactive");
        details.put("newStatus", newStatus ? "Active" : "Inactive");
        logEvent("USER_STATUS_CHANGED", userId, username, request, details);
    }

    // Yorum: Admin işlemi logu
    public void logAdminAction(Long adminUserId, String adminUsername, String action, HttpServletRequest request) {
        Map<String, Object> details = new HashMap<>();
        details.put("message", "Admin işlemi gerçekleştirildi");
        details.put("action", action);
        logEvent("ADMIN_ACTION", adminUserId, adminUsername, request, details);
    }

    // Yorum: Log listesi getir
    public Page<SecurityLog> getLogs(Pageable pageable) {
        return securityLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    // Yorum: Event type'a göre filtrele
    public Page<SecurityLog> getLogsByEventType(String eventType, Pageable pageable) {
        return securityLogRepository.findByEventTypeOrderByCreatedAtDesc(eventType, pageable);
    }

    // Yorum: Kullanıcıya göre filtrele
    public Page<SecurityLog> getLogsByUser(Long userId, Pageable pageable) {
        return securityLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    // Yorum: Son 24 saatteki loglar
    public List<SecurityLog> getRecentLogs() {
        return securityLogRepository.findByCreatedAtGreaterThanEqualOrderByCreatedAtDesc(LocalDateTime.now().minusHours(24));
    }

    // Yorum: İstatistikler
    public Map<String, Object> getLogStats() {
        try {
            System.out.println("SecurityLogService.getLogStats - Starting stats calculation");
            Map<String, Object> stats = new HashMap<>();
            
            // Yorum: Basit sayım için tüm logları alıp manuel sayım yapacağız
            List<SecurityLog> allLogs = securityLogRepository.findAll();
            System.out.println("SecurityLogService.getLogStats - Total logs found: " + allLogs.size());
            
            long totalLogs = allLogs.size();
            stats.put("totalLogs", totalLogs);
            
            // Yorum: Son 24 saatteki başarısız girişler
            LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
            long failedLogins24h = allLogs.stream()
                .filter(log -> "LOGIN_FAILED".equals(log.getEventType()) && 
                              log.getCreatedAt().isAfter(twentyFourHoursAgo))
                .count();
            System.out.println("SecurityLogService.getLogStats - Failed logins 24h: " + failedLogins24h);
            stats.put("failedLogins24h", failedLogins24h);
            
            // Yorum: Başarılı girişler
            long loginSuccessCount = allLogs.stream()
                .filter(log -> "LOGIN_SUCCESS".equals(log.getEventType()))
                .count();
            System.out.println("SecurityLogService.getLogStats - Login success count: " + loginSuccessCount);
            stats.put("loginSuccessCount", loginSuccessCount);
            
            // Yorum: Başarısız girişler
            long loginFailedCount = allLogs.stream()
                .filter(log -> "LOGIN_FAILED".equals(log.getEventType()))
                .count();
            System.out.println("SecurityLogService.getLogStats - Login failed count: " + loginFailedCount);
            stats.put("loginFailedCount", loginFailedCount);
            
            // Yorum: Kullanıcı oluşturma
            long userCreatedCount = allLogs.stream()
                .filter(log -> "USER_CREATED".equals(log.getEventType()))
                .count();
            System.out.println("SecurityLogService.getLogStats - User created count: " + userCreatedCount);
            stats.put("userCreatedCount", userCreatedCount);
            
            // Yorum: Rol değişiklikleri
            long roleChangedCount = allLogs.stream()
                .filter(log -> "ROLE_CHANGED".equals(log.getEventType()))
                .count();
            System.out.println("SecurityLogService.getLogStats - Role changed count: " + roleChangedCount);
            stats.put("roleChangedCount", roleChangedCount);
            
            System.out.println("SecurityLogService.getLogStats - Stats calculated successfully: " + stats);
            return stats;
        } catch (Exception e) {
            System.err.println("SecurityLogService.getLogStats - Error: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Yorum: Client IP adresini al
    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) return "unknown";
        
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
