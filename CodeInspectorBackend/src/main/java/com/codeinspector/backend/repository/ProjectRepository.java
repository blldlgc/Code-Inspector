package com.codeinspector.backend.repository;

import com.codeinspector.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findBySlug(String slug);
    boolean existsBySlug(String slug);
    
    // Native SQL query to ensure we get only non-deleted projects
    @Query(value = "SELECT * FROM projects WHERE visibility != 'deleted' OR visibility IS NULL", nativeQuery = true)
    List<Project> findAllNonDeleted();
    
    // Find projects owned by a user (not deleted)
    @Query(value = "SELECT p.* FROM projects p " +
           "JOIN users u ON p.owner_id = u.id " +
           "WHERE u.username = :username AND (p.visibility != 'deleted' OR p.visibility IS NULL)", 
           nativeQuery = true)
    List<Project> findByOwnerUsernameNotDeleted(@Param("username") String username);
    
    // Find projects shared with a user (not deleted)
    @Query(value = "SELECT p.* FROM projects p " +
           "JOIN project_shared_users psu ON p.id = psu.project_id " +
           "JOIN users u ON psu.user_id = u.id " +
           "WHERE u.username = :username AND (p.visibility != 'deleted' OR p.visibility IS NULL)", 
           nativeQuery = true)
    List<Project> findSharedWithUserNotDeleted(@Param("username") String username);
    
    // Find projects shared with teams that user belongs to (not deleted)
    @Query(value = "SELECT DISTINCT p.* FROM projects p " +
           "JOIN project_shared_teams pst ON p.id = pst.project_id " +
           "JOIN teams t ON pst.team_id = t.id " +
           "JOIN team_users tu ON t.id = tu.team_id " +
           "JOIN users u ON tu.user_id = u.id " +
           "WHERE u.username = :username AND (p.visibility != 'deleted' OR p.visibility IS NULL)", 
           nativeQuery = true)
    List<Project> findSharedWithTeamsByUserNotDeleted(@Param("username") String username);
    
    // Find public projects (not deleted)
    @Query(value = "SELECT * FROM projects WHERE visibility = 'public' AND visibility != 'deleted'", 
           nativeQuery = true)
    List<Project> findPublicNotDeleted();
    
    // For ADMIN users - get all non-deleted projects
    @Query(value = "SELECT * FROM projects WHERE visibility != 'deleted' OR visibility IS NULL", 
           nativeQuery = true)
    List<Project> findAllForAdmin();
}