package com.codeinspector.backend.service;

import com.codeinspector.backend.model.Project;
import com.codeinspector.backend.model.User;
import com.codeinspector.backend.model.Team;
import com.codeinspector.backend.repository.ProjectRepository;
import com.codeinspector.backend.repository.UserRepository;
import com.codeinspector.backend.repository.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.nio.file.Files;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectStorageService storageService;
    private UserRepository userRepository;
    private TeamRepository teamRepository;

    @Autowired
    public ProjectService(ProjectRepository projectRepository, ProjectStorageService storageService) {
        this.projectRepository = projectRepository;
        this.storageService = storageService;
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
            
            // Get projects from all possible access paths
            List<Project> accessibleProjects = new ArrayList<>();
            
            try {
                // 1. User's own projects
                accessibleProjects.addAll(projectRepository.findByOwnerUsername(username));
                
                // Temporarily disabled advanced filtering
                // Return all projects for now
                List<Project> allProjects = projectRepository.findAll();
                addNonDuplicates(accessibleProjects, allProjects);
            } catch (Exception e) {
                System.out.println("Specific query failed: " + e.getMessage());
                // Fallback to all projects
                return projectRepository.findAll();
            }
            
            return accessibleProjects;
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Error in project listing: " + e.getMessage());
            try {
                // Last resort fallback
                return projectRepository.findAll();
            } catch (Exception ex) {
                return List.of(); // Return empty list if all else fails
            }
        }
    }
    
    private void addNonDuplicates(List<Project> target, List<Project> source) {
        for (Project p : source) {
            if (p.getId() != null && target.stream().noneMatch(tp -> p.getId().equals(tp.getId()))) {
                target.add(p);
            }
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
        // delete files recursively
        Path dir = storageService.getProjectDirectory(slug);
        if (Files.exists(dir)) {
            deleteRecursively(dir);
        }
        projectRepository.delete(p);
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
}