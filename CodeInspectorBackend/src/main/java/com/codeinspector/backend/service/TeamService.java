package com.codeinspector.backend.service;

import com.codeinspector.backend.model.Team;
import com.codeinspector.backend.model.User;
import com.codeinspector.backend.repository.TeamRepository;
import com.codeinspector.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeamService {
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public TeamService(TeamRepository teamRepository, UserRepository userRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
    }

    public List<Team> list() { return teamRepository.findAll(); }

    @Transactional
    public Team create(String name) {
        if (teamRepository.existsByName(name)) throw new IllegalArgumentException("Team exists");
        Team t = new Team();
        t.setName(name);
        return teamRepository.save(t);
    }

    @Transactional
    public void delete(Long id) { teamRepository.deleteById(id); }

    @Transactional
    public Team addUser(Long teamId, String username) {
        Team t = teamRepository.findById(teamId).orElseThrow();
        User u = userRepository.findByUsername(username).orElseThrow();
        t.getUsers().add(u);
        return teamRepository.save(t);
    }

    @Transactional
    public Team removeUser(Long teamId, String username) {
        Team t = teamRepository.findById(teamId).orElseThrow();
        User u = userRepository.findByUsername(username).orElseThrow();
        t.getUsers().remove(u);
        return teamRepository.save(t);
    }
}



