package com.codeinspector.backend.service;

import com.codeinspector.backend.model.User;
import com.codeinspector.backend.model.UserRole;
import com.codeinspector.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FirebaseDataMigrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void migrateUser(String firebaseUid, String email, String username) {
        if (userRepository.findByEmail(email).isPresent()) {
            return; // Kullanıcı zaten migrate edilmiş
        }

        // Geçici şifre oluştur
        String temporaryPassword = UUID.randomUUID().toString();
        
        User user = User.builder()
                .email(email)
                .username(username)
                .password(passwordEncoder.encode(temporaryPassword))
                .firebaseUid(firebaseUid)
                .role(UserRole.USER)
                .enabled(true)
                .build();

        userRepository.save(user);

        // TODO: Kullanıcıya geçici şifresini e-posta ile gönder
        sendTemporaryPasswordEmail(email, temporaryPassword);
    }

    private void sendTemporaryPasswordEmail(String email, String temporaryPassword) {
        // E-posta gönderme işlemi burada implement edilecek
        // Şimdilik sadece konsola yazdıralım
        System.out.println("Temporary password for " + email + ": " + temporaryPassword);
    }
}
