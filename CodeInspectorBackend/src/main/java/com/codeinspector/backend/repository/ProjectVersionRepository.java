package com.codeinspector.backend.repository;

import com.codeinspector.backend.model.ProjectVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectVersionRepository extends JpaRepository<ProjectVersion, Long> {
    List<ProjectVersion> findByProjectId(Long projectId);
    
    List<ProjectVersion> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    
    Optional<ProjectVersion> findByProjectIdAndVersionName(Long projectId, String versionName);
    
    @Query("SELECT COUNT(v) FROM ProjectVersion v WHERE v.project.id = :projectId")
    long countByProjectId(@Param("projectId") Long projectId);
    
    // Bu sorguyu düzelttik - join kullanarak
    @Query("SELECT v FROM ProjectVersion v JOIN v.project p WHERE p.slug = :slug ORDER BY v.createdAt DESC")
    List<ProjectVersion> findByProjectSlugOrderByCreatedAtDesc(@Param("slug") String slug);
    
    // Bu sorguyu düzelttik - join kullanarak
    @Query("SELECT v FROM ProjectVersion v JOIN v.project p WHERE p.slug = :slug AND v.commitHash = :commitHash")
    Optional<ProjectVersion> findByProjectSlugAndCommitHash(@Param("slug") String slug, @Param("commitHash") String commitHash);
}