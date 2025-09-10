package com.codeinspector.backend.service;

import com.codeinspector.backend.dto.UserDTO;
import com.codeinspector.backend.model.User;
import com.codeinspector.backend.model.UserRole;
import com.codeinspector.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return convertToDTO(user);
    }

    @Transactional
    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

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
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByEnabled(true);
        long inactiveUsers = totalUsers - activeUsers;
        long adminCount = userRepository.countByRole(UserRole.ADMIN);

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("inactiveUsers", inactiveUsers);
        stats.put("adminCount", adminCount);
        stats.put("newUsersLast24h", 4); // TODO: Implement actual logic

        return stats;
    }

    public Map<String, Object> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

        double cpuLoad = osBean.getSystemLoadAverage();
        long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
        long maxMemory = memoryBean.getHeapMemoryUsage().getMax();
        double memoryUsage = (double) usedMemory / maxMemory * 100;

        health.put("cpuUsage", cpuLoad >= 0 ? cpuLoad * 100 : 45); // Fallback if not available
        health.put("memoryUsage", Math.round(memoryUsage));
        health.put("diskUsage", 28); // TODO: Implement actual disk usage check
        health.put("apiResponseTime", 120); // TODO: Implement actual API response time monitoring

        return health;
    }

    public List<Map<String, Object>> getSecurityLogs() {
        // TODO: Implement actual security log storage and retrieval
        List<Map<String, Object>> logs = new ArrayList<>();
        
        // Sample logs for demonstration
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
}


