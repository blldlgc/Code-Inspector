package com.codeinspector.backend.service;

import com.codeinspector.backend.model.Project;
import com.codeinspector.backend.model.User;
import com.codeinspector.backend.repository.ProjectRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.nio.file.Files;
import java.io.IOException;
import java.util.List;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectStorageService storageService;

    public ProjectService(ProjectRepository projectRepository, ProjectStorageService storageService) {
        this.projectRepository = projectRepository;
        this.storageService = storageService;
    }

    public List<Project> list() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) {
            return List.of();
        }
        return projectRepository.findByOwnerUsernameOrSharedUsersUsernameOrSharedTeamsUsersUsernameOrVisibility(
            username, username, username, "public");
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
        p.setVisibility("private");
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            p.setOwner(user);
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


