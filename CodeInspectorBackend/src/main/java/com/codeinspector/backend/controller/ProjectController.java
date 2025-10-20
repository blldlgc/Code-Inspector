package com.codeinspector.backend.controller;

import com.codeinspector.backend.model.Project;
import com.codeinspector.backend.service.ProjectService;
import com.codeinspector.backend.service.ProjectImportService;
import com.codeinspector.backend.service.ProjectStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.net.URI;
import java.util.List;
import java.nio.file.Path;
import java.nio.file.Files;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectImportService importService;
    private final ProjectStorageService storageService;

    public ProjectController(ProjectService projectService, ProjectImportService importService, ProjectStorageService storageService) {
        this.projectService = projectService;
        this.importService = importService;
        this.storageService = storageService;
    }

    @GetMapping
    public ResponseEntity<List<Project>> list() {
        return ResponseEntity.ok(projectService.list());
    }

    @GetMapping(path = "/{slug}")
    public ResponseEntity<Project> get(@PathVariable String slug) {
        Project p = projectService.getBySlug(slug);
        if (p == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(p);
    }

    public record CreateProjectRequest(String name, String slug, String description, String vcsUrl) {}

    @PostMapping
    public ResponseEntity<Project> create(@RequestBody CreateProjectRequest req) throws Exception {
        Project created = projectService.create(req.name(), req.slug(), req.description(), req.vcsUrl());
        return ResponseEntity.created(URI.create("/api/projects/" + created.getSlug())).body(created);
    }

    public record UpdateProjectRequest(String name, String description, String vcsUrl, String visibility) {}

    @PutMapping(path = "/{slug}")
    public ResponseEntity<Project> update(@PathVariable String slug, @RequestBody UpdateProjectRequest req) {
        Project updated = projectService.updateMeta(slug, req.name(), req.description(), req.vcsUrl(), req.visibility());
        return ResponseEntity.ok(updated);
    }
    
    // Project sharing endpoints
    public record ShareRequest(String username) {}
    
    @PostMapping(path = "/{slug}/share/user")
    public ResponseEntity<Project> shareWithUser(@PathVariable String slug, @RequestBody ShareRequest req) {
        Project updated = projectService.shareWithUser(slug, req.username());
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping(path = "/{slug}/share/user")
    public ResponseEntity<Project> unshareWithUser(@PathVariable String slug, @RequestBody ShareRequest req) {
        Project updated = projectService.unshareWithUser(slug, req.username());
        return ResponseEntity.ok(updated);
    }
    
    public record TeamShareRequest(Long teamId) {}
    
    @PostMapping(path = "/{slug}/share/team")
    public ResponseEntity<Project> shareWithTeam(@PathVariable String slug, @RequestBody TeamShareRequest req) {
        Project updated = projectService.shareWithTeam(slug, req.teamId());
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping(path = "/{slug}/share/team")
    public ResponseEntity<Project> unshareWithTeam(@PathVariable String slug, @RequestBody TeamShareRequest req) {
        Project updated = projectService.unshareWithTeam(slug, req.teamId());
        return ResponseEntity.ok(updated);
    }

    @PostMapping(path = "/{slug}/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<Void> uploadZip(@PathVariable String slug, @RequestParam("file") org.springframework.web.multipart.MultipartFile file) throws Exception {
        importService.importZip(slug, file);
        return ResponseEntity.ok().build();
    }

    public record ImportGitRequest(String repoUrl) {}

    @PostMapping(path = "/{slug}/import-git")
    public ResponseEntity<Void> importGit(@PathVariable String slug, @RequestBody ImportGitRequest req) throws Exception {
        importService.importFromGit(slug, req.repoUrl());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping(path = "/{slug}")
    public ResponseEntity<Void> delete(@PathVariable String slug) throws Exception {
        projectService.deleteBySlug(slug);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(path = "/{slug}/download")
    public ResponseEntity<FileSystemResource> download(@PathVariable String slug) throws Exception {
        Project p = projectService.getBySlug(slug);
        if (p == null) return ResponseEntity.notFound().build();
        Path dir = Path.of(p.getStoragePath());
        if (!Files.exists(dir)) return ResponseEntity.notFound().build();
        // For simplicity return directory listing is not allowed; in future, zip on the fly
        return ResponseEntity.status(501).build();
    }

    @GetMapping(path = "/{slug}/files")
    public ResponseEntity<List<ProjectStorageService.FileInfo>> listFiles(@PathVariable String slug, @RequestParam(value = "path", required = false) String path) throws Exception {
        return ResponseEntity.ok(storageService.listDirectory(slug, path));
    }

    @GetMapping(path = "/{slug}/file")
    public ResponseEntity<String> readFile(@PathVariable String slug, @RequestParam("path") String path) throws Exception {
        String content = storageService.readTextFile(slug, path, 1024 * 1024); // 1MB limit
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        return ResponseEntity.ok().headers(headers).body(content);
    }
}