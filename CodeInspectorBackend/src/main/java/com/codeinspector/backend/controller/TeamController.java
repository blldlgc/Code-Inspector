package com.codeinspector.backend.controller;

import com.codeinspector.backend.model.Team;
import com.codeinspector.backend.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/teams")
@PreAuthorize("hasRole('ADMIN')")
public class TeamController {
    private final TeamService teamService;
    public TeamController(TeamService teamService) { this.teamService = teamService; }

    @GetMapping
    public ResponseEntity<List<Team>> list() { return ResponseEntity.ok(teamService.list()); }

    public record CreateTeamRequest(String name) {}
    @PostMapping
    public ResponseEntity<Team> create(@RequestBody CreateTeamRequest req) {
        Team t = teamService.create(req.name());
        return ResponseEntity.created(URI.create("/api/teams/" + t.getId())).body(t);
    }

    @DeleteMapping(path = "/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        teamService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record UserChangeRequest(String username) {}
    @PostMapping(path = "/{id}/users")
    public ResponseEntity<Team> addUser(@PathVariable Long id, @RequestBody UserChangeRequest req) {
        return ResponseEntity.ok(teamService.addUser(id, req.username()));
    }
    @DeleteMapping(path = "/{id}/users")
    public ResponseEntity<Team> removeUser(@PathVariable Long id, @RequestBody UserChangeRequest req) {
        return ResponseEntity.ok(teamService.removeUser(id, req.username()));
    }
}



