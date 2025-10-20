package com.codeinspector.backend.service;

import org.eclipse.jgit.api.Git;
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

    private final ProjectStorageService storageService;

    public ProjectImportService(ProjectStorageService storageService) {
        this.storageService = storageService;
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
        Path destDir = storageService.ensureProjectDirectory(slug);
        if (Files.exists(destDir.resolve(".git"))) {
            return; // already cloned
        }
        Git.cloneRepository()
            .setURI(repoUrl)
            .setDirectory(destDir.toFile())
            .call()
            .close();
    }
}


