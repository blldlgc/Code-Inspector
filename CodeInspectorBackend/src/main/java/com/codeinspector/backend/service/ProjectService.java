package com.codeinspector.backend.service;

import com.codeinspector.backend.model.Project;
import com.codeinspector.backend.model.User;
import com.codeinspector.backend.model.Team;
import com.codeinspector.backend.model.UserRole;
import com.codeinspector.backend.model.ProjectVersion;
import com.codeinspector.backend.repository.ProjectRepository;
import com.codeinspector.backend.repository.UserRepository;
import com.codeinspector.backend.repository.TeamRepository;
import com.codeinspector.backend.repository.ProjectVersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.nio.file.Files;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectStorageService storageService;
    private final ProjectVersionRepository projectVersionRepository;
    private UserRepository userRepository;
    private TeamRepository teamRepository;

    @Autowired
    public ProjectService(ProjectRepository projectRepository, ProjectStorageService storageService, ProjectVersionRepository projectVersionRepository) {
        this.projectRepository = projectRepository;
        this.storageService = storageService;
        this.projectVersionRepository = projectVersionRepository;
        // userRepository ve teamRepository null olabilir
    }

    @Autowired(required = false)
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired(required = false)
    public void setTeamRepository(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public List<Project> list() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : null;
            if (username == null) {
                return List.of();
            }
            
            // Check if user is admin
            boolean isAdmin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));
            
            List<Project> projects;
            if (isAdmin) {
                // Admin görüyor, tüm silinmemiş projeleri getir
                System.out.println("Admin user, returning all non-deleted projects");
                projects = projectRepository.findAllForAdmin();
            } else {
                // Normal kullanıcı, sadece kendi ve paylaşılan projeleri getir
                System.out.println("Regular user, returning user-specific projects");
                
                // Use Set to avoid duplicates
                Set<Project> accessibleProjects = new HashSet<>();
                
                // 1. Kullanıcının kendi projeleri
                accessibleProjects.addAll(projectRepository.findByOwnerUsernameNotDeleted(username));
                
                // 2. Kullanıcıyla doğrudan paylaşılan projeler
                accessibleProjects.addAll(projectRepository.findSharedWithUserNotDeleted(username));
                
                // 3. Kullanıcının takımlarıyla paylaşılan projeler
                accessibleProjects.addAll(projectRepository.findSharedWithTeamsByUserNotDeleted(username));
                
                // 4. Public projeler
                accessibleProjects.addAll(projectRepository.findPublicNotDeleted());
                
                System.out.println("Found " + accessibleProjects.size() + " accessible projects for user " + username);
                
                // Convert Set to List
                projects = new ArrayList<>(accessibleProjects);
            }
            
            // Her proje için en son versiyon tarihini güncelle
            for (Project project : projects) {
                updateProjectWithLatestVersionDate(project);
            }
            
            return projects;
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Error in project listing: " + e.getMessage());
            return List.of(); // Hata durumunda boş liste döndür
        }
    }

    @Transactional
    public Project create(String name, String slug, String description, String vcsUrl) throws Exception {
        if (projectRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Project slug already exists");
        }
        Path dir = storageService.ensureProjectDirectory(slug);

        Project p = new Project();
        p.setName(name);
        p.setSlug(slug);
        p.setDescription(description);
        p.setVcsUrl(vcsUrl);
        p.setStoragePath(dir.toString());
        p.setVisibility("private"); // Default visibility is private
        
        // Try to set owner safely
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                Object principal = auth.getPrincipal();
                if (principal instanceof User) {
                    p.setOwner((User) principal);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Continue without setting owner
        }
        
        return projectRepository.save(p);
    }

    @Transactional
    public Project updateMeta(String slug, String name, String description, String vcsUrl, String visibility) {
        Project p = projectRepository.findBySlug(slug).orElseThrow();
        if (name != null && !name.isBlank()) p.setName(name);
        p.setDescription(description);
        p.setVcsUrl(vcsUrl);
        if (visibility != null) p.setVisibility(visibility);
        return projectRepository.save(p);
    }
    
    @Transactional
    public Project shareWithUser(String slug, String username) {
        if (userRepository == null) {
            throw new UnsupportedOperationException("User repository not available");
        }
        Project p = projectRepository.findBySlug(slug).orElseThrow();
        User user = userRepository.findByUsername(username).orElseThrow();
        p.getSharedUsers().add(user);
        return projectRepository.save(p);
    }
    
    @Transactional
    public Project unshareWithUser(String slug, String username) {
        if (userRepository == null) {
            throw new UnsupportedOperationException("User repository not available");
        }
        Project p = projectRepository.findBySlug(slug).orElseThrow();
        User user = userRepository.findByUsername(username).orElseThrow();
        p.getSharedUsers().remove(user);
        return projectRepository.save(p);
    }
    
    @Transactional
    public Project shareWithTeam(String slug, Long teamId) {
        if (teamRepository == null) {
            throw new UnsupportedOperationException("Team repository not available");
        }
        Project p = projectRepository.findBySlug(slug).orElseThrow();
        Team team = teamRepository.findById(teamId).orElseThrow();
        p.getSharedTeams().add(team);
        return projectRepository.save(p);
    }
    
    @Transactional
    public Project unshareWithTeam(String slug, Long teamId) {
        if (teamRepository == null) {
            throw new UnsupportedOperationException("Team repository not available");
        }
        Project p = projectRepository.findBySlug(slug).orElseThrow();
        Team team = teamRepository.findById(teamId).orElseThrow();
        p.getSharedTeams().remove(team);
        return projectRepository.save(p);
    }

    public Project getBySlug(String slug) {
        return projectRepository.findBySlug(slug).orElse(null);
    }

    @Transactional
    public void deleteBySlug(String slug) throws IOException {
        Project p = projectRepository.findBySlug(slug).orElse(null);
        if (p == null) return;
        
        // Soft delete: mark as "deleted" instead of physically removing
        System.out.println("Marking project as deleted: " + slug);
        p.setVisibility("deleted");
        projectRepository.save(p);
        System.out.println("Project marked as deleted: " + slug);
    }

    private void deleteRecursively(Path path) throws IOException {
        if (Files.isDirectory(path)) {
            try (var stream = Files.list(path)) {
                for (Path child : stream.toList()) {
                    deleteRecursively(child);
                }
            }
        }
        Files.deleteIfExists(path);
    }
    
    /**
     * Projenin en son versiyon tarihini alıp updatedAt alanını günceller
     */
    private void updateProjectWithLatestVersionDate(Project project) {
        try {
            // Projenin en son versiyonunu al
            List<ProjectVersion> versions = projectVersionRepository.findByProjectIdOrderByCreatedAtDesc(project.getId());
            
            if (!versions.isEmpty()) {
                // En son versiyonun tarihini al
                ProjectVersion latestVersion = versions.get(0);
                project.setUpdatedAt(latestVersion.getCreatedAt());
            }
            // Eğer versiyon yoksa, projenin kendi updatedAt'ini kullan (değişiklik yapma)
        } catch (Exception e) {
            System.err.println("Error updating project with latest version date: " + e.getMessage());
            // Hata durumunda projenin mevcut updatedAt'ini kullan
        }
    }
}