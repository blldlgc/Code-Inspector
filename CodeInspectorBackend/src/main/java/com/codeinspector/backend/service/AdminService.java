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
import jakarta.servlet.http.HttpServletRequest;

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
    private final SecurityLogService securityLogService;

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
    public UserDTO updateUser(Long id, UserDTO userDTO, HttpServletRequest request) {
        System.out.println("AdminService.updateUser - ID: " + id);
        System.out.println("AdminService.updateUser - UserDTO: " + userDTO);
        
        User user = userRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        System.out.println("AdminService.updateUser - Found user: " + user.getUsername() + ", Role: " + user.getRole());

        // Yorum: Değişiklikleri takip etmek için eski değerleri sakla
        UserRole oldRole = user.getRole();
        boolean oldStatus = user.isEnabled();

        // Admin kullanıcısının rolünü değiştirmeye izin verme
        if (user.getRole() == UserRole.ADMIN && userDTO.getRole() != UserRole.ADMIN) {
            System.out.println("AdminService.updateUser - Attempting to change admin role, blocking");
            throw new IllegalStateException("Admin kullanıcısının rolü değiştirilemez");
        }

        // Yorum: Username ve email değişikliklerini kontrol et
        if (userDTO.getUsername() != null && !userDTO.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(userDTO.getUsername())) {
                System.out.println("AdminService.updateUser - Username already exists: " + userDTO.getUsername());
                throw new IllegalArgumentException("Username is already taken");
            }
            user.setUsername(userDTO.getUsername());
        }

        if (userDTO.getEmail() != null && !userDTO.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(userDTO.getEmail())) {
                System.out.println("AdminService.updateUser - Email already exists: " + userDTO.getEmail());
                throw new IllegalArgumentException("Email is already registered");
            }
            user.setEmail(userDTO.getEmail());
        }

        user.setEnabled(userDTO.isEnabled());
        if (userDTO.getRole() != null) {
            user.setRole(userDTO.getRole());
        }

        System.out.println("AdminService.updateUser - Saving user with role: " + user.getRole() + ", enabled: " + user.isEnabled());
        
        User savedUser = userRepository.save(user);
        
        // Yorum: Değişiklikleri logla
        if (oldRole != user.getRole()) {
            securityLogService.logRoleChanged(user.getId(), user.getUsername(), oldRole.name(), user.getRole().name(), request);
        }
        
        if (oldStatus != user.isEnabled()) {
            securityLogService.logUserStatusChanged(user.getId(), user.getUsername(), oldStatus, user.isEnabled(), request);
        }
        
        return convertToDTO(savedUser);
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
        
        // Son bir haftada giriş yapan aktif kullanıcı sayısını hesapla
        long activeUsersLastWeek = getActiveUsersLastWeek();

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsersLastWeek); // Gerçek aktif kullanıcı sayısı
        stats.put("inactiveUsers", inactiveUsers);
        stats.put("adminCount", adminCount);
        stats.put("newUsersLast24h", userRepository.countByCreatedAtAfterAndDeletedAtIsNull(LocalDateTime.now().minusHours(24)));

        return stats;
    }
    
    // Son bir haftada giriş yapan kullanıcı sayısını hesapla
    private long getActiveUsersLastWeek() {
        try {
            LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
            
            // LOGIN_SUCCESS event'lerini son bir hafta içinde filtrele
            List<com.codeinspector.backend.model.SecurityLog> loginLogs = securityLogService.getLogsByEventType("LOGIN_SUCCESS", 
                org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE))
                .getContent()
                .stream()
                .filter(log -> log.getCreatedAt().isAfter(oneWeekAgo))
                .collect(java.util.stream.Collectors.toList());
            
            // Benzersiz kullanıcı ID'lerini say
            long uniqueActiveUsers = loginLogs.stream()
                .map(com.codeinspector.backend.model.SecurityLog::getUserId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .count();
            
            System.out.println("AdminService.getActiveUsersLastWeek - Found " + uniqueActiveUsers + " active users in last week");
            return uniqueActiveUsers;
            
        } catch (Exception e) {
            System.err.println("AdminService.getActiveUsersLastWeek - Error: " + e.getMessage());
            e.printStackTrace();
            // Hata durumunda enabled kullanıcı sayısını döndür
            return userRepository.countByEnabledTrueAndDeletedAtIsNull();
        }
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