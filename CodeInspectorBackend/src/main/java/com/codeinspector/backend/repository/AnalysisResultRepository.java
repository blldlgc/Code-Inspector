package com.codeinspector.backend.repository;

import com.codeinspector.backend.model.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {
    List<AnalysisResult> findByProjectVersionId(Long versionId);
    
    @Query("SELECT a FROM AnalysisResult a WHERE a.projectVersion.id = :versionId AND a.analysisType = :analysisType")
    Optional<AnalysisResult> findByVersionIdAndType(
            @Param("versionId") Long versionId, 
            @Param("analysisType") String analysisType);
    
    @Query("SELECT a FROM AnalysisResult a WHERE a.projectVersion.project.slug = :slug AND a.projectVersion.versionName = :versionName")
    List<AnalysisResult> findByProjectSlugAndVersionName(
            @Param("slug") String slug, 
            @Param("versionName") String versionName);
}
