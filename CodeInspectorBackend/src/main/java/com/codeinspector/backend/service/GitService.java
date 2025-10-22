package com.codeinspector.backend.service;

import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.PullResult;
import org.eclipse.jgit.api.RemoteSetUrlCommand;
import org.eclipse.jgit.api.ResetCommand;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectReader;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.lib.RepositoryState;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.util.io.DisabledOutputStream;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.transport.CredentialsProvider;
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
        return importFromGitHub(projectPath, githubUrl, message, "main", null, null);
    }
    
    /**
     * GitHub'dan projeyi klonlar veya günceller (token ile)
     */
    public String importFromGitHub(String projectPath, String githubUrl, String message, String githubToken) throws Exception {
        return importFromGitHub(projectPath, githubUrl, message, "main", null, githubToken);
    }
    
    /**
     * GitHub'dan projeyi klonlar veya günceller (branch ve token ile)
     */
    public String importFromGitHub(String projectPath, String githubUrl, String message, String branchName, String githubToken) throws Exception {
        return importFromGitHub(projectPath, githubUrl, message, branchName, null, githubToken);
    }

    /**
     * Git repository'sinin durumunu temizler (rebase, merge, cherry-pick vb. durumları)
     */
    private void cleanupGitState(File projectDir) throws Exception {
        File gitDir = new File(projectDir, ".git");
        if (!gitDir.exists()) {
            return;
        }
        
        try (Git git = Git.open(projectDir)) {
            Repository repository = git.getRepository();
            
            // Repository durumunu kontrol et
            RepositoryState state = repository.getRepositoryState();
            logger.info("Repository state: {}", state);
            
            switch (state) {
                case REBASING_MERGE:
                case REBASING_REBASING:
                case REBASING_INTERACTIVE:
                    logger.info("Aborting rebase operation");
                    try {
                        git.rebase().setOperation(org.eclipse.jgit.api.RebaseCommand.Operation.ABORT).call();
                    } catch (Exception e) {
                        logger.warn("Could not abort rebase: {}", e.getMessage());
                    }
                    break;
                case MERGING:
                case MERGING_RESOLVED:
                    logger.info("Aborting merge operation");
                    try {
                        // Merge abort için reset kullan
                        git.reset().setMode(ResetCommand.ResetType.HARD).call();
                    } catch (Exception e) {
                        logger.warn("Could not abort merge: {}", e.getMessage());
                    }
                    break;
                case CHERRY_PICKING:
                case CHERRY_PICKING_RESOLVED:
                    logger.info("Aborting cherry-pick operation");
                    try {
                        // Cherry-pick abort için reset kullan
                        git.reset().setMode(ResetCommand.ResetType.HARD).call();
                    } catch (Exception e) {
                        logger.warn("Could not abort cherry-pick: {}", e.getMessage());
                    }
                    break;
                case REVERTING:
                case REVERTING_RESOLVED:
                    logger.info("Aborting revert operation");
                    try {
                        // Revert abort için reset kullan
                        git.reset().setMode(ResetCommand.ResetType.HARD).call();
                    } catch (Exception e) {
                        logger.warn("Could not abort revert: {}", e.getMessage());
                    }
                    break;
                case BISECTING:
                    logger.info("Aborting bisect operation");
                    try {
                        // Bisect abort için reset kullan
                        git.reset().setMode(ResetCommand.ResetType.HARD).call();
                    } catch (Exception e) {
                        logger.warn("Could not abort bisect: {}", e.getMessage());
                    }
                    break;
                default:
                    // Normal durum, temizlik gerekmez
                    break;
            }
            
            // Working directory'yi temizle
            try {
                git.clean().setCleanDirectories(true).setForce(true).call();
                git.reset().setMode(ResetCommand.ResetType.HARD).call();
            } catch (Exception e) {
                logger.warn("Could not clean working directory: {}", e.getMessage());
            }
            
        } catch (Exception e) {
            logger.warn("Error during git state cleanup: {}", e.getMessage());
            // Temizlik başarısız olsa bile devam et
        }
    }

    /**
     * GitHub'dan belirli bir branch'den projeyi klonlar veya günceller (token ile)
     */
    public String importFromGitHub(String projectPath, String githubUrl, String message, String branchName, String githubUsername, String githubToken) throws Exception {
        File projectDir = new File(projectPath);
        File gitDir = new File(projectPath, ".git");
        
        // Eğer .git klasörü yoksa veya farklı bir branch'den import yapılıyorsa, yeniden klonla
        boolean shouldReclone = !gitDir.exists();
        
        if (gitDir.exists()) {
            try (Git git = Git.open(projectDir)) {
                // Mevcut branch'i kontrol et
                String currentBranch = git.getRepository().getBranch();
                if (!branchName.equals(currentBranch)) {
                    logger.info("Different branch requested ({} vs {}), will reclone", branchName, currentBranch);
                    shouldReclone = true;
                }
            } catch (Exception e) {
                logger.warn("Error checking current branch, will reclone: {}", e.getMessage());
                shouldReclone = true;
            }
        }
        
        if (shouldReclone) {
            // Önce mevcut klasörü temizle
            if (projectDir.exists()) {
                cleanProjectFiles(projectPath);
            }
            
            // Geçici bir klasöre klonla
            Path tempDir = Files.createTempDirectory("github-import-");
            try {
                // GitHub token varsa authentication ekle
                CredentialsProvider credentialsProvider = createCredentialsProvider(githubUsername, githubToken);
                
                // Alternatif olarak authenticated URL kullan
                String authenticatedUrl = createAuthenticatedUrl(githubUrl, githubToken);
                logger.info("Attempting to clone with URL: {}", authenticatedUrl.replace(githubToken != null ? githubToken : "", "***"));
                
                Git.cloneRepository()
                   .setURI(authenticatedUrl)
                   .setDirectory(tempDir.toFile())
                   .setBranch("refs/heads/" + branchName)
                   .setCredentialsProvider(credentialsProvider)
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
        // Aynı branch'den import yapılıyorsa, pull yap
        else {
            // Önce repository durumunu temizle
            cleanupGitState(projectDir);
            
            Git git = Git.open(projectDir);
            
            try {
                // Remote kontrolü
                boolean hasOrigin = false;
                for (org.eclipse.jgit.transport.RemoteConfig remote : git.remoteList().call()) {
                    if (remote.getName().equals("origin")) {
                        hasOrigin = true;
                        break;
                    }
                }
                
                // Authenticated URL kullan
                String authenticatedUrl = createAuthenticatedUrl(githubUrl, githubToken);
                
                // Remote yoksa veya farklı bir URL ise, yeni remote ekle
                if (!hasOrigin) {
                    git.remoteAdd().setName("origin").setUri(new org.eclipse.jgit.transport.URIish(authenticatedUrl)).call();
                } else {
                    // Mevcut remote URL'i kontrol et ve gerekirse güncelle
                    String existingUrl = git.getRepository().getConfig().getString("remote", "origin", "url");
                    if (!authenticatedUrl.equals(existingUrl)) {
                        RemoteSetUrlCommand remoteSetUrlCommand = git.remoteSetUrl();
                        remoteSetUrlCommand.setName("origin");
                        remoteSetUrlCommand.setUri(new org.eclipse.jgit.transport.URIish(authenticatedUrl));
                        remoteSetUrlCommand.call();
                    }
                }
                
                // GitHub token varsa authentication ekle
                CredentialsProvider credentialsProvider = createCredentialsProvider(githubUsername, githubToken);
                
                // Pull yap
                PullResult pullResult = git.pull()
                    .setRemote("origin")
                    .setRemoteBranchName(branchName)
                    .setCredentialsProvider(credentialsProvider)
                    .call();
                
                // Eğer pull başarısızsa, main branch'i dene
                if (!pullResult.isSuccessful() && !branchName.equals("main")) {
                    logger.info("Pull failed for branch {}, trying main branch", branchName);
                    pullResult = git.pull()
                        .setRemote("origin")
                        .setRemoteBranchName("main")
                        .setCredentialsProvider(credentialsProvider)
                        .call();
                }
                
                // Eğer hala başarısızsa, master branch'i dene
                if (!pullResult.isSuccessful() && !branchName.equals("master")) {
                    logger.info("Pull failed for main branch, trying master branch");
                    pullResult = git.pull()
                        .setRemote("origin")
                        .setRemoteBranchName("master")
                        .setCredentialsProvider(credentialsProvider)
                        .call();
                }
                
                if (!pullResult.isSuccessful()) {
                    throw new Exception("Failed to pull from any branch (tried: " + branchName + ", main, master)");
                }
            
                String commitHash;
                
                // MergeResult veya RebaseResult kontrol et
                if (pullResult.getMergeResult() != null && pullResult.getMergeResult().getNewHead() != null) {
                    commitHash = pullResult.getMergeResult().getNewHead().getName();
                } else if (pullResult.getRebaseResult() != null) {
                    // Rebase sonucundan commit hash'i al
                    commitHash = git.getRepository().resolve("HEAD").getName();
                } else {
                    // Son commit'i al
                    Iterable<RevCommit> commits = git.log().setMaxCount(1).call();
                    RevCommit lastCommit = commits.iterator().next();
                    commitHash = lastCommit.getName();
                }
                
                return commitHash;
                
            } catch (Exception e) {
                logger.error("Error during pull operation, will try to reclone: {}", e.getMessage());
                git.close();
                
                // Pull başarısız olursa, repository'yi temizle ve yeniden klonla
                cleanProjectFiles(projectPath);
                return importFromGitHub(projectPath, githubUrl, message, branchName, githubUsername, githubToken);
            } finally {
                git.close();
            }
        }
    }

    /**
     * GitHub token'ından CredentialsProvider oluşturur
     */
    private CredentialsProvider createCredentialsProvider(String githubUsername, String githubToken) {
        String masked = githubToken != null ? "***" + githubToken.substring(Math.max(0, githubToken.length() - 4)) : "null";
        logger.info("Creating credentials provider - username: {}, token: {}", githubUsername, masked);
        
        if (githubToken != null && !githubToken.trim().isEmpty()) {
            // JGit için: username + PAT (password) gerekir
            String user = (githubUsername != null && !githubUsername.isBlank()) ? githubUsername : "git";
            logger.info("Using UsernamePasswordCredentialsProvider with user: {}", user);
            return new UsernamePasswordCredentialsProvider(user, githubToken);
        }
        
        logger.info("No token provided, using anonymous access (public repository)");
        return null;
    }
    
    /**
     * GitHub URL'ini token ile birlikte oluşturur (alternatif authentication yöntemi)
     */
    private String createAuthenticatedUrl(String githubUrl, String githubToken) {
        if (githubToken != null && !githubToken.trim().isEmpty()) {
            // URL'yi token ile birlikte oluştur: https://token@github.com/user/repo.git
            String authenticatedUrl = githubUrl.replace("https://", "https://" + githubToken + "@");
            logger.info("Created authenticated URL: {}", authenticatedUrl.replace(githubToken, "***" + githubToken.substring(Math.max(0, githubToken.length() - 4))));
            return authenticatedUrl;
        }
        return githubUrl;
    }

    /**
     * İki commit arasındaki farkları döndürür
     */
    public List<FileDiff> getDiffBetweenCommits(String projectPath, String oldCommit, String newCommit) throws Exception {
        logger.info("Getting diff between commits: {} and {} in project path: {}", oldCommit, newCommit, projectPath);
        
        if (oldCommit == null || newCommit == null) {
            logger.error("Commit hash cannot be null. oldCommit: {}, newCommit: {}", oldCommit, newCommit);
            throw new IllegalArgumentException("Commit hash cannot be null");
        }
        
        Git git = null;
        try {
            git = Git.open(new File(projectPath));
            ObjectReader reader = git.getRepository().newObjectReader();
            
            // Eski commit tree'sini hazırla
            ObjectId oldObjectId = git.getRepository().resolve(oldCommit);
            if (oldObjectId == null) {
                logger.error("Could not resolve old commit: {}", oldCommit);
                throw new IllegalArgumentException("Could not resolve old commit: " + oldCommit);
            }
            
            CanonicalTreeParser oldTreeIter = new CanonicalTreeParser();
            ObjectId oldTree = git.getRepository().resolve(oldCommit + "^{tree}");
            if (oldTree == null) {
                logger.error("Could not resolve old commit tree: {}", oldCommit);
                throw new IllegalArgumentException("Could not resolve old commit tree: " + oldCommit);
            }
            oldTreeIter.reset(reader, oldTree);
            
            // Yeni commit tree'sini hazırla
            ObjectId newObjectId = git.getRepository().resolve(newCommit);
            if (newObjectId == null) {
                logger.error("Could not resolve new commit: {}", newCommit);
                throw new IllegalArgumentException("Could not resolve new commit: " + newCommit);
            }
            
            CanonicalTreeParser newTreeIter = new CanonicalTreeParser();
            ObjectId newTree = git.getRepository().resolve(newCommit + "^{tree}");
            if (newTree == null) {
                logger.error("Could not resolve new commit tree: {}", newCommit);
                throw new IllegalArgumentException("Could not resolve new commit tree: " + newCommit);
            }
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
                DiffFormatter entryFormatter = new DiffFormatter(out);
                entryFormatter.setRepository(git.getRepository());
                entryFormatter.format(entry);
                String diffText = out.toString(StandardCharsets.UTF_8);
                
                FileDiff fileDiff = new FileDiff();
                fileDiff.setPath(entry.getNewPath().equals("/dev/null") ? entry.getOldPath() : entry.getNewPath());
                fileDiff.setChangeType(entry.getChangeType().name());
                fileDiff.setDiff(diffText);
                
                fileDiffs.add(fileDiff);
            }
            
            logger.info("Found {} differences between commits", fileDiffs.size());
            return fileDiffs;
        } catch (Exception e) {
            logger.error("Error getting diff between commits: {} and {}", oldCommit, newCommit, e);
            throw e;
        } finally {
            if (git != null) {
                git.close();
            }
        }
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