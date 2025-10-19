package com.codeinspector.backend.service;

import com.codeinspector.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Kullanıcıyı önce username ile, bulunamazsa email ile arar
        return userRepository.findByUsername(username)
                .or(() -> username.contains("@") ? userRepository.findByEmail(username) : java.util.Optional.empty())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + username));
    }
}
