package com.codeinspector.backend.repository;

import com.codeinspector.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<Project> findByOwnerUsernameOrSharedUsersUsernameOrSharedTeamsUsersUsernameOrVisibility(String ownerUsername, String sharedUsername, String teamMemberUsername, String visibility);
}


