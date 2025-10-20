package com.codeinspector.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectStorageService {

    private final Path rootDir;

    public ProjectStorageService(@Value("${project.storage.root}") String root) {
        this.rootDir = Paths.get(root).toAbsolutePath().normalize();
        try {
            if (!Files.exists(this.rootDir)) {
                Files.createDirectories(this.rootDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize project storage root: " + this.rootDir, e);
        }
    }

    public Path ensureProjectDirectory(String slug) throws IOException {
        Path dir = rootDir.resolve(slug);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }
        return dir;
    }

    public Path getProjectDirectory(String slug) {
        return rootDir.resolve(slug);
    }

    public Path saveFile(String slug, String filename, byte[] content) throws IOException {
        Path dir = ensureProjectDirectory(slug);
        Path target = dir.resolve(filename).normalize();
        if (!target.startsWith(dir)) {
            throw new SecurityException("Invalid path traversal");
        }
        Files.write(target, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return target;
    }

    public record FileInfo(String name, String path, boolean directory, long size) {}

    public List<FileInfo> listDirectory(String slug, String relativePath) throws IOException {
        Path base = getProjectDirectory(slug);
        if (!Files.exists(base)) return List.of();
        Path target = (relativePath == null || relativePath.isBlank()) ? base : base.resolve(relativePath).normalize();
        if (!target.startsWith(base)) throw new SecurityException("Invalid path traversal");
        if (!Files.exists(target)) return List.of();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(target)) {
            List<FileInfo> list = new ArrayList<>();
            for (Path p : stream) {
                boolean isDir = Files.isDirectory(p);
                long size = isDir ? 0L : Files.size(p);
                String name = p.getFileName().toString();
                String rel = base.relativize(p).toString();
                list.add(new FileInfo(name, rel, isDir, size));
            }
            return list.stream()
                .sorted((a,b) -> {
                    if (a.directory != b.directory) return a.directory ? -1 : 1;
                    return a.name.compareToIgnoreCase(b.name);
                })
                .collect(Collectors.toList());
        }
    }

    public String readTextFile(String slug, String relativePath, int maxBytes) throws IOException {
        Path base = getProjectDirectory(slug);
        if (!Files.exists(base)) throw new IOException("Project directory not found");
        Path target = base.resolve(relativePath).normalize();
        if (!target.startsWith(base)) throw new SecurityException("Invalid path traversal");
        if (!Files.exists(target) || Files.isDirectory(target)) throw new IOException("File not found");
        long size = Files.size(target);
        if (size > maxBytes) {
            byte[] buf = Files.readAllBytes(target);
            String content = new String(buf, 0, Math.min(buf.length, maxBytes));
            return content;
        }
        return Files.readString(target);
    }
}


