package com.codeinspector.backend.controller;

import com.codeinspector.backend.dto.AuthRequest;
import com.codeinspector.backend.dto.AuthResponse;
import com.codeinspector.backend.dto.RegisterRequest;
import com.codeinspector.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        System.out.println("AuthController - Login request for username: " + request.getUsername());
        AuthResponse response = authService.login(request);
        System.out.println("AuthController - Login response: " + response);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Backend'de özel bir işlem yapmaya gerek yok, client tarafında token silinecek
        return ResponseEntity.ok().build();
    }
}
