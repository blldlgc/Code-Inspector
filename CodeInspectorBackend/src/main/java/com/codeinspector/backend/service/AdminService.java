package com.codeinspector.backend.service;

import com.codeinspector.backend.dto.UserDTO;
import com.codeinspector.backend.dto.AdminCreateUserRequest;
import com.codeinspector.backend.model.User;
import com.codeinspector.backend.model.UserRole;
import com.codeinspector.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserDTO> getAllUsers() {
        return userRepository.findByDeletedAtIsNull().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUser(Long id) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return convertToDTO(user);
    }

    @Transactional
    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        // Admin kullanıcısının rolünü değiştirmeye izin verme
        if (user.getRole() == UserRole.ADMIN && userDTO.getRole() != UserRole.ADMIN) {
            throw new IllegalStateException("Admin kullanıcısının rolü değiştirilemez");
        }

        user.setUsername(userDTO.getUsername());
        user.setEmail(userDTO.getEmail());
        user.setEnabled(userDTO.isEnabled());
        if (userDTO.getRole() != null) {
            user.setRole(userDTO.getRole());
        }

        return convertToDTO(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        // Admin kullanıcısını silmeye izin verme
        if (user.getRole() == UserRole.ADMIN) {
            throw new IllegalStateException("Admin kullanıcısı silinemez");
        }

        // Soft delete - kullanıcıyı silmek yerine deletedAt alanını güncelle
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalUsers = userRepository.countByDeletedAtIsNull();
        long activeUsers = userRepository.countByEnabledTrueAndDeletedAtIsNull();
        long inactiveUsers = totalUsers - activeUsers;
        long adminCount = userRepository.countByRoleAndDeletedAtIsNull(UserRole.ADMIN);

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("inactiveUsers", inactiveUsers);
        stats.put("adminCount", adminCount);
        stats.put("newUsersLast24h", userRepository.countByCreatedAtAfterAndDeletedAtIsNull(LocalDateTime.now().minusHours(24)));

        return stats;
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.codeinspector.backend.filter.ApiLatencyFilter apiLatencyFilter;

    public Map<String, Object> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        
        // Yorum: Cgroup tabanlı gerçek metrikler (container içinde)
        double cpuUsage = com.codeinspector.backend.utils.CgroupMetrics.getCpuUsagePercent();
        double memoryUsage = com.codeinspector.backend.utils.CgroupMetrics.getMemoryUsagePercent();
        double diskUsage = com.codeinspector.backend.utils.CgroupMetrics.getDiskUsagePercent();

        // Yorum: İlk ölçümde CPU -1 dönebilir; bu durumda geçici bir tahmin kullanılır
        if (cpuUsage < 0) {
            double load = ManagementFactory.getOperatingSystemMXBean().getSystemLoadAverage();
            int cores = Runtime.getRuntime().availableProcessors();
            cpuUsage = (load >= 0 && cores > 0) ? Math.min(100.0, (load * 100.0) / cores) : 0.0;
        }

        health.put("cpuUsage", Math.round(cpuUsage));
        health.put("memoryUsage", Math.round(memoryUsage));
        health.put("diskUsage", Math.round(diskUsage));
        health.put("apiResponseTime", apiLatencyFilter.getAverageMs());

        return health;
    }

    public List<Map<String, Object>> getSecurityLogs() {
        List<Map<String, Object>> logs = new ArrayList<>();
        
        logs.add(createLog("warning", "Başarısız giriş denemesi - IP: 192.168.1.100", LocalDateTime.now().minusMinutes(5)));
        logs.add(createLog("info", "Yeni kullanıcı kaydı: user@example.com", LocalDateTime.now().minusMinutes(10)));
        logs.add(createLog("error", "Yetkisiz API erişim denemesi", LocalDateTime.now().minusMinutes(15)));
        logs.add(createLog("success", "Sistem yedeklemesi başarıyla tamamlandı", LocalDateTime.now().minusMinutes(20)));

        return logs;
    }

    private Map<String, Object> createLog(String type, String message, LocalDateTime timestamp) {
        Map<String, Object> log = new HashMap<>();
        log.put("type", type);
        log.put("message", message);
        log.put("timestamp", timestamp);
        return log;
    }

    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .build();
    }

    @Transactional
    public UserDTO createUser(AdminCreateUserRequest request) {
        // Basit doğrulamalar
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        UserRole role = request.getRole() != null ? request.getRole() : UserRole.USER;

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .enabled(request.isEnabled())
                .build();

        userRepository.save(user);
        return convertToDTO(user);
    }
}