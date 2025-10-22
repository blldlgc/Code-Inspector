package com.codeinspector.backend.service;

import com.codeinspector.backend.model.Project;
import com.codeinspector.backend.model.ProjectVersion;
import com.codeinspector.backend.repository.ProjectRepository;
import com.codeinspector.backend.repository.ProjectVersionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectVersionService {
    private static final Logger logger = LoggerFactory.getLogger(ProjectVersionService.class);

    private final ProjectRepository projectRepository;
    private final ProjectVersionRepository versionRepository;
    private final GitService gitService;

    @Autowired
    public ProjectVersionService(
            ProjectRepository projectRepository,
            ProjectVersionRepository versionRepository,
            GitService gitService) {
        this.projectRepository = projectRepository;
        this.versionRepository = versionRepository;
        this.gitService = gitService;
    }

    /**
     * Proje için tüm versiyonları listeler
     */
    public List<ProjectVersion> listVersions(Long projectId) {
        try {
            return versionRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        } catch (Exception e) {
            logger.error("Error listing versions for project ID: " + projectId, e);
            return Collections.emptyList();
        }
    }

    /**
     * Proje slug'ına göre tüm versiyonları listeler
     */
    public List<ProjectVersion> listVersionsBySlug(String slug) {
        try {
            // Önce projenin var olup olmadığını kontrol et
            Project project = projectRepository.findBySlug(slug).orElse(null);
            if (project == null) {
                logger.warn("Project not found with slug: " + slug);
                return Collections.emptyList();
            }
            
            // Versiyonları getir
            return versionRepository.findByProjectSlugOrderByCreatedAtDesc(slug);
        } catch (Exception e) {
            logger.error("Error listing versions for project slug: " + slug, e);
            return Collections.emptyList();
        }
    }

    /**
     * ID'ye göre versiyon getirir
     */
    public ProjectVersion getVersion(Long versionId) {
        try {
            return versionRepository.findById(versionId).orElse(null);
        } catch (Exception e) {
            logger.error("Error getting version with ID: " + versionId, e);
            return null;
        }
    }

    /**
     * ZIP dosyasından yeni versiyon oluşturur
     */
    @Transactional
    public ProjectVersion createVersionFromZip(Project project, MultipartFile zipFile, String message) throws Exception {
        try {
            // ZIP dosyasını içe aktar ve commit oluştur
            String commitHash = gitService.importFromZip(project.getStoragePath(), zipFile, message);
            
            // Versiyon numarası oluştur (v1, v2, ...)
            String versionName = generateVersionName(project.getId());
            
            // Versiyon kaydı oluştur
            ProjectVersion version = new ProjectVersion();
            version.setProject(project);
            version.setVersionName(versionName);
            version.setCommitHash(commitHash);
            version.setCommitMessage(message);
            
            return versionRepository.save(version);
        } catch (Exception e) {
            logger.error("Error creating version from ZIP for project: " + project.getSlug(), e);
            throw e;
        }
    }

    /**
     * GitHub'dan yeni versiyon oluşturur
     */
    @Transactional
    public ProjectVersion createVersionFromGitHub(Project project, String githubUrl, String message) throws Exception {
        return createVersionFromGitHub(project, githubUrl, message, "main", null, null);
    }

    /**
     * GitHub'dan belirli bir branch'den yeni versiyon oluşturur
     */
    @Transactional
    public ProjectVersion createVersionFromGitHub(Project project, String githubUrl, String message, String branchName) throws Exception {
        return createVersionFromGitHub(project, githubUrl, message, branchName, null, null);
    }
    
    /**
     * GitHub'dan belirli bir branch'den yeni versiyon oluşturur (token ile)
     */
    @Transactional
    public ProjectVersion createVersionFromGitHub(Project project, String githubUrl, String message, String branchName, String githubToken) throws Exception {
        return createVersionFromGitHub(project, githubUrl, message, branchName, null, githubToken);
    }
    
    /**
     * GitHub'dan belirli bir branch'den yeni versiyon oluşturur (token ile)
     */
    @Transactional
    public ProjectVersion createVersionFromGitHub(Project project, String githubUrl, String message, String branchName, String githubUsername, String githubToken) throws Exception {
        try {
            // GitHub'dan içe aktar ve commit oluştur
            String commitHash = gitService.importFromGitHub(project.getStoragePath(), githubUrl, message, branchName, githubUsername, githubToken);
            
            // Versiyon numarası oluştur (v1, v2, ...)
            String versionName = generateVersionName(project.getId());
            
            // Versiyon kaydı oluştur
            ProjectVersion version = new ProjectVersion();
            version.setProject(project);
            version.setVersionName(versionName);
            version.setCommitHash(commitHash);
            version.setCommitMessage(message);
            version.setGithubUrl(githubUrl);
            version.setBranchName(branchName);
            
            // Proje VCS URL'ini güncelle
            project.setVcsUrl(githubUrl);
            projectRepository.save(project);
            
            return versionRepository.save(version);
        } catch (Exception e) {
            logger.error("Error creating version from GitHub for project: " + project.getSlug(), e);
            throw e;
        }
    }

    /**
     * İki versiyon arasındaki farkları getirir
     */
    public List<GitService.FileDiff> getDiffBetweenVersions(Project project, Long oldVersionId, Long newVersionId) throws Exception {
        try {
            ProjectVersion oldVersion = versionRepository.findById(oldVersionId).orElseThrow();
            ProjectVersion newVersion = versionRepository.findById(newVersionId).orElseThrow();
            
            return gitService.getDiffBetweenCommits(
                    project.getStoragePath(),
                    oldVersion.getCommitHash(),
                    newVersion.getCommitHash());
        } catch (Exception e) {
            logger.error("Error getting diff between versions: " + oldVersionId + " and " + newVersionId, e);
            throw e;
        }
    }

    /**
     * Belirli bir versiyona geçiş yapar
     */
    public void checkoutVersion(Project project, Long versionId) throws Exception {
        try {
            ProjectVersion version = versionRepository.findById(versionId).orElseThrow();
            gitService.checkoutCommit(project.getStoragePath(), version.getCommitHash());
        } catch (Exception e) {
            logger.error("Error checking out version: " + versionId + " for project: " + project.getSlug(), e);
            throw e;
        }
    }

    /**
     * Yeni versiyon adı oluşturur (v1, v2, ...)
     */
    private String generateVersionName(Long projectId) {
        try {
            long versionCount = versionRepository.countByProjectId(projectId);
            return "v" + (versionCount + 1);
        } catch (Exception e) {
            logger.error("Error generating version name for project ID: " + projectId, e);
            return "v1"; // Fallback to v1 if there's an error
        }
    }

    /**
     * Commit hash'ine göre versiyon var mı kontrol eder
     */
    public boolean existsByCommitHash(String slug, String commitHash) {
        try {
            Optional<ProjectVersion> version = versionRepository.findByProjectSlugAndCommitHash(slug, commitHash);
            return version.isPresent();
        } catch (Exception e) {
            logger.error("Error checking if version exists by commit hash: " + commitHash + " for project: " + slug, e);
            return false;
        }
    }

    /**
     * Commit geçmişini döndürür
     */
    public List<GitService.CommitInfo> getCommitHistory(Project project) throws Exception {
        try {
            return gitService.getCommitHistory(project.getStoragePath());
        } catch (Exception e) {
            logger.error("Error getting commit history for project: " + project.getSlug(), e);
            throw e;
        }
    }
}