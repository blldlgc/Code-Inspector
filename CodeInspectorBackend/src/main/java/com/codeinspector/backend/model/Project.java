package com.codeinspector.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // Proje adı

    @Column
    private String description; // Proje açıklaması

    @Column(nullable = false, unique = true)
    private String slug; // URL dostu benzersiz kimlik

    @Column(nullable = false)
    private String storagePath; // Depolanan dizin yolu (volume içinde)

    @Column
    private String vcsUrl; // GitHub URL (varsa)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @JsonIgnore // döngüyü ve hassas veriyi gizle
    private User owner; // Proje sahibi

    @ManyToMany
    @JoinTable(
        name = "project_shared_users",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonIgnore
    private Set<User> sharedUsers = new LinkedHashSet<>();

    @ManyToMany
    @JoinTable(
        name = "project_shared_teams",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "team_id")
    )
    @JsonIgnore
    private Set<Team> sharedTeams = new LinkedHashSet<>();

    @Column(nullable = false)
    private String visibility = "private"; // private | team | public

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }

    public String getVcsUrl() { return vcsUrl; }
    public void setVcsUrl(String vcsUrl) { this.vcsUrl = vcsUrl; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public Set<User> getSharedUsers() { return sharedUsers; }
    public void setSharedUsers(Set<User> sharedUsers) { this.sharedUsers = sharedUsers; }
    public Set<Team> getSharedTeams() { return sharedTeams; }
    public void setSharedTeams(Set<Team> sharedTeams) { this.sharedTeams = sharedTeams; }
    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}


