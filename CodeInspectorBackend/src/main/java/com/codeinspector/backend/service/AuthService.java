package com.codeinspector.backend.service;

import com.codeinspector.backend.dto.AuthRequest;
import com.codeinspector.backend.dto.AuthResponse;
import com.codeinspector.backend.dto.RegisterRequest;
import com.codeinspector.backend.model.User;
import com.codeinspector.backend.model.UserRole;
import com.codeinspector.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.servlet.http.HttpServletRequest;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final SecurityLogService securityLogService;

    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        // Email formatı kontrolü
        if (!request.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Invalid email format");
        }

        // Username kontrolü (en az 3 karakter, sadece harf, sayı ve alt çizgi)
        if (!request.getUsername().matches("^[a-zA-Z0-9_]{3,}$")) {
            throw new IllegalArgumentException("Username must be at least 3 characters long and can only contain letters, numbers and underscore");
        }

        // Password kontrolü
        if (request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }

        // Önce username ve email kontrolü
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        var user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)
                .enabled(true)
                .build();

        userRepository.save(user);
        var token = jwtService.generateToken(user);
        
        // Yorum: Yeni kullanıcı kaydı logu
        securityLogService.logUserCreated(user.getId(), user.getUsername(), httpRequest);
        
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(AuthRequest request, HttpServletRequest httpRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
            
            System.out.println("AuthService - Attempting to authenticate user: " + request.getUsername());
            
            // Kullanıcıyı önce username ile, bulunamazsa email ile bul
            var identifier = request.getUsername();
            var user = userRepository.findByUsername(identifier)
                    .or(() -> identifier != null && identifier.contains("@")
                            ? userRepository.findByEmail(identifier)
                            : java.util.Optional.empty())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid username or password."));
            
            System.out.println("AuthService - Found user: " + user);
            System.out.println("AuthService - User details:");
            System.out.println("  - Username: " + user.getUsername());
            System.out.println("  - Email: " + user.getEmail());
            System.out.println("  - Role: " + user.getRole());
            System.out.println("  - Authorities: " + user.getAuthorities());
            
            var token = jwtService.generateToken(user);
            
            var response = AuthResponse.builder()
                    .token(token)
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build();
            
            System.out.println("AuthService - Generated response:");
            System.out.println("  - Username: " + response.getUsername());
            System.out.println("  - Email: " + response.getEmail());
            System.out.println("  - Role: " + response.getRole());
            System.out.println("  - Token exists: " + (response.getToken() != null));
            
            // Yorum: Başarılı giriş logu
            securityLogService.logLoginSuccess(user.getId(), user.getUsername(), httpRequest);
            
            return response;
        } catch (Exception e) {
            // Yorum: Başarısız giriş logu
            securityLogService.logLoginFailed(request.getUsername(), httpRequest, "Invalid credentials");
            throw new BadCredentialsException("Invalid username or password");
        }
    }
}
