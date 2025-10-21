package com.codeinspector.backend.service;

import com.codeinspector.backend.model.Project;
import org.eclipse.jgit.api.Git;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class ProjectImportService {
    private static final Logger logger = LoggerFactory.getLogger(ProjectImportService.class);

    private final ProjectStorageService storageService;
    private final ProjectService projectService;
    private final ProjectVersionService versionService;

    public ProjectImportService(
            ProjectStorageService storageService,
            ProjectService projectService,
            ProjectVersionService versionService) {
        this.storageService = storageService;
        this.projectService = projectService;
        this.versionService = versionService;
    }

    public void importZip(String slug, MultipartFile file) throws IOException {
        Path destDir = storageService.ensureProjectDirectory(slug);
        try (InputStream in = file.getInputStream(); ZipInputStream zis = new ZipInputStream(in)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path target = destDir.resolve(entry.getName()).normalize();
                if (!target.startsWith(destDir)) {
                    throw new SecurityException("Invalid path in ZIP");
                }
                if (entry.isDirectory()) {
                    Files.createDirectories(target);
                } else {
                    if (target.getParent() != null) {
                        Files.createDirectories(target.getParent());
                    }
                    Files.copy(zis, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                }
                zis.closeEntry();
            }
        }
    }

    public void importFromGit(String slug, String repoUrl) throws Exception {
        importFromGit(slug, repoUrl, "main");
    }

    public void importFromGit(String slug, String repoUrl, String branchName) throws Exception {
        try {
            // Projeyi getir
            Project project = projectService.getBySlug(slug);
            if (project == null) {
                logger.error("Project not found with slug: {}", slug);
                throw new IllegalArgumentException("Project not found with slug: " + slug);
            }
            
            // Versiyon oluştur (bu aynı zamanda Git klonlamasını da yapacak)
            String commitMessage = "Initial import from GitHub: " + repoUrl + " (branch: " + branchName + ")";
            versionService.createVersionFromGitHub(project, repoUrl, commitMessage, branchName);
            
            // VCS URL'i güncelle
            projectService.updateMeta(slug, project.getName(), project.getDescription(), repoUrl, project.getVisibility());
            
            logger.info("Successfully imported project from Git: {} (branch: {})", repoUrl, branchName);
        } catch (Exception e) {
            logger.error("Error importing from Git: {} (branch: {})", repoUrl, branchName, e);
            throw e;
        }
    }
}


