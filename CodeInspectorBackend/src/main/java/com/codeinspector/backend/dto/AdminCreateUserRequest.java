package com.codeinspector.backend.dto;

import com.codeinspector.backend.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCreateUserRequest {
    private String username; // Kullanıcı adı
    private String email;    // E-posta
    private String password; // Parola (min 6)
    private UserRole role;   // USER | ADMIN
    private boolean enabled; // Aktif/Pasif
}



