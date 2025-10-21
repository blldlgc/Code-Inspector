package com.codeinspector.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "project_versions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnore
    private Project project;
    
    @Column(nullable = false)
    private String versionName; // v1, v2, etc. veya semantic versioning
    
    @Column(nullable = false)
    private String commitHash; // Git commit hash
    
    @Column(columnDefinition = "TEXT")
    private String commitMessage; // Kullanıcının versiyonla ilgili açıklaması
    
    @Column(name = "github_url")
    private String githubUrl; // Bu versiyon GitHub'dan mı geldi?
    
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
    
    @OneToMany(mappedBy = "projectVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<AnalysisResult> analysisResults = new ArrayList<>();
}