package com.codeinspector.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "analysis_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "version_id", nullable = false)
    @JsonIgnore
    private ProjectVersion projectVersion;
    
    @Column(nullable = false)
    private String analysisType; // "code-quality", "security", "coverage", etc.
    
    @Column(columnDefinition = "TEXT")
    private String resultData; // JSON formatında analiz sonuçları
    
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}