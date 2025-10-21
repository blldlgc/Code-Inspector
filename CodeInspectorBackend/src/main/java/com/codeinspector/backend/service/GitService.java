package com.codeinspector.backend.service;

import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.PullResult;
import org.eclipse.jgit.api.RemoteSetUrlCommand;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.util.io.DisabledOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Service
public class GitService {
    private static final Logger logger = LoggerFactory.getLogger(GitService.class);

    /**
     * Git deposu başlatır veya var olan depoyu açar
     */
    public Git initOrOpenRepository(String projectPath) throws GitAPIException, IOException {
        File gitDir = new File(projectPath, ".git");
        if (gitDir.exists()) {
            return Git.open(new File(projectPath));
        } else {
            return Git.init().setDirectory(new File(projectPath)).call();
        }
    }

    /**
     * Tüm dosyaları Git'e ekler ve commit oluşturur
     */
    public String commitAllChanges(String projectPath, String message) throws GitAPIException, IOException {
        Git git = Git.open(new File(projectPath));
        git.add().addFilepattern(".").call();
        RevCommit commit = git.commit().setMessage(message).call();
        String commitHash = commit.getId().getName();
        git.close();
        return commitHash;
    }

    /**
     * ZIP dosyasını projeye çıkarır ve commit oluşturur
     */
    public String importFromZip(String projectPath, MultipartFile zipFile, String message) throws Exception {
        // Git deposunu başlat veya aç
        Git git = initOrOpenRepository(projectPath);
        
        // Mevcut dosyaları temizle (.git klasörü hariç)
        cleanProjectFiles(projectPath);
        
        // ZIP dosyasını çıkar
        try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(zipFile.getInputStream())) {
            java.util.zip.ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path targetPath = Path.of(projectPath, entry.getName()).normalize();
                
                // Path traversal saldırılarını önle
                if (!targetPath.startsWith(projectPath)) {
                    throw new SecurityException("ZIP içinde güvenlik riski: " + entry.getName());
                }
                
                if (entry.isDirectory()) {
                    Files.createDirectories(targetPath);
                } else {
                    Files.createDirectories(targetPath.getParent());
                    Files.copy(zis, targetPath);
                }
            }
        }
        
        // Değişiklikleri commit'le
        String commitHash = commitAllChanges(projectPath, message);
        
        return commitHash;
    }

    /**
     * GitHub'dan projeyi klonlar veya günceller
     */
    public String importFromGitHub(String projectPath, String githubUrl, String message) throws Exception {
        File projectDir = new File(projectPath);
        File gitDir = new File(projectPath, ".git");
        
        // Eğer .git klasörü yoksa, GitHub'dan klonla
        if (!gitDir.exists()) {
            // Önce mevcut klasörü temizle
            if (projectDir.exists()) {
                cleanProjectFiles(projectPath);
            }
            
            // Geçici bir klasöre klonla
            Path tempDir = Files.createTempDirectory("github-import-");
            try {
                Git.cloneRepository()
                   .setURI(githubUrl)
                   .setDirectory(tempDir.toFile())
                   .call()
                   .close();
                
                // .git klasörünü koru, diğer dosyaları kopyala
                File tempGitDir = new File(tempDir.toFile(), ".git");
                FileUtils.copyDirectory(tempDir.toFile(), projectDir);
                
                // Yeni bir commit oluştur
                Git git = Git.open(projectDir);
                git.add().addFilepattern(".").call();
                RevCommit commit = git.commit().setMessage(message + " (Imported from GitHub: " + githubUrl + ")").call();
                String commitHash = commit.getId().getName();
                git.close();
                
                return commitHash;
            } finally {
                FileUtils.deleteDirectory(tempDir.toFile());
            }
        } 
        // .git klasörü varsa, pull yap
        else {
            Git git = Git.open(projectDir);
            
            // Remote kontrolü
            boolean hasOrigin = false;
            for (org.eclipse.jgit.transport.RemoteConfig remote : git.remoteList().call()) {
                if (remote.getName().equals("origin")) {
                    hasOrigin = true;
                    break;
                }
            }
            
            // Remote yoksa veya farklı bir URL ise, yeni remote ekle
            if (!hasOrigin) {
                git.remoteAdd().setName("origin").setUri(new org.eclipse.jgit.transport.URIish(githubUrl)).call();
            } else {
                // Mevcut remote URL'i kontrol et ve gerekirse güncelle
                String existingUrl = git.getRepository().getConfig().getString("remote", "origin", "url");
                if (!githubUrl.equals(existingUrl)) {
                    RemoteSetUrlCommand remoteSetUrlCommand = git.remoteSetUrl();
                    remoteSetUrlCommand.setName("origin");
                    remoteSetUrlCommand.setUri(new org.eclipse.jgit.transport.URIish(githubUrl));
                    remoteSetUrlCommand.call();
                }
            }
            
            // Pull yap
            PullResult pullResult = git.pull().setRemote("origin").setRemoteBranchName("main").call();
            
            // Eğer pull başarısızsa, master branch'i dene
            if (!pullResult.isSuccessful()) {
                pullResult = git.pull().setRemote("origin").setRemoteBranchName("master").call();
            }
            
            String commitHash = pullResult.getMergeResult().getNewHead().getName();
            git.close();
            
            return commitHash;
        }
    }

    /**
     * İki commit arasındaki farkları döndürür
     */
    public List<FileDiff> getDiffBetweenCommits(String projectPath, String oldCommit, String newCommit) throws Exception {
        Git git = Git.open(new File(projectPath));
        ObjectReader reader = git.getRepository().newObjectReader();
        
        // Eski commit tree'sini hazırla
        CanonicalTreeParser oldTreeIter = new CanonicalTreeParser();
        ObjectId oldTree = git.getRepository().resolve(oldCommit + "^{tree}");
        oldTreeIter.reset(reader, oldTree);
        
        // Yeni commit tree'sini hazırla
        CanonicalTreeParser newTreeIter = new CanonicalTreeParser();
        ObjectId newTree = git.getRepository().resolve(newCommit + "^{tree}");
        newTreeIter.reset(reader, newTree);
        
        // Diff'leri al
        List<DiffEntry> diffs = git.diff()
                .setNewTree(newTreeIter)
                .setOldTree(oldTreeIter)
                .call();
        
        // Diff'leri formatla
        List<FileDiff> fileDiffs = new ArrayList<>();
        DiffFormatter formatter = new DiffFormatter(DisabledOutputStream.INSTANCE);
        formatter.setRepository(git.getRepository());
        
        for (DiffEntry entry : diffs) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            formatter.format(entry);
            String diffText = out.toString(StandardCharsets.UTF_8);
            
            FileDiff fileDiff = new FileDiff();
            fileDiff.setPath(entry.getNewPath().equals("/dev/null") ? entry.getOldPath() : entry.getNewPath());
            fileDiff.setChangeType(entry.getChangeType().name());
            fileDiff.setDiff(diffText);
            
            fileDiffs.add(fileDiff);
        }
        
        git.close();
        return fileDiffs;
    }

    /**
     * Belirli bir commit'e checkout yapar
     */
    public void checkoutCommit(String projectPath, String commitHash) throws GitAPIException, IOException {
        Git git = Git.open(new File(projectPath));
        git.checkout().setName(commitHash).call();
        git.close();
    }

    /**
     * Proje klasöründeki dosyaları temizler (.git klasörü hariç)
     */
    private void cleanProjectFiles(String projectPath) throws IOException {
        File projectDir = new File(projectPath);
        if (!projectDir.exists()) {
            Files.createDirectories(projectDir.toPath());
            return;
        }
        
        // .git klasörü dışındaki tüm dosya ve klasörleri listele
        File[] files = projectDir.listFiles(file -> !file.getName().equals(".git"));
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    FileUtils.deleteDirectory(file);
                } else {
                    file.delete();
                }
            }
        }
    }

    /**
     * Commit geçmişini döndürür
     */
    public List<CommitInfo> getCommitHistory(String projectPath) throws GitAPIException, IOException {
        Git git = Git.open(new File(projectPath));
        Iterable<RevCommit> commits = git.log().call();
        
        List<CommitInfo> commitHistory = new ArrayList<>();
        for (RevCommit commit : commits) {
            CommitInfo info = new CommitInfo();
            info.setHash(commit.getId().getName());
            info.setMessage(commit.getShortMessage());
            info.setAuthor(commit.getAuthorIdent().getName());
            info.setDate(commit.getAuthorIdent().getWhenAsInstant());
            
            commitHistory.add(info);
        }
        
        git.close();
        return commitHistory;
    }

    /**
     * Dosya farkları için DTO
     */
    public static class FileDiff {
        private String path;
        private String changeType;
        private String diff;
        
        // Getter ve setter metotları
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
        
        public String getChangeType() { return changeType; }
        public void setChangeType(String changeType) { this.changeType = changeType; }
        
        public String getDiff() { return diff; }
        public void setDiff(String diff) { this.diff = diff; }
    }

    /**
     * Commit bilgileri için DTO
     */
    public static class CommitInfo {
        private String hash;
        private String message;
        private String author;
        private java.time.Instant date;
        
        // Getter ve setter metotları
        public String getHash() { return hash; }
        public void setHash(String hash) { this.hash = hash; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getAuthor() { return author; }
        public void setAuthor(String author) { this.author = author; }
        
        public java.time.Instant getDate() { return date; }
        public void setDate(java.time.Instant date) { this.date = date; }
    }
}