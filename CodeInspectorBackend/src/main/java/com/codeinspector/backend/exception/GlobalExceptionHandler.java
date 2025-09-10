package com.codeinspector.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", e.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolationException(DataIntegrityViolationException e) {
        Map<String, String> errorResponse = new HashMap<>();
        String message = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        
        if (message.contains("username")) {
            errorResponse.put("message", "Username is already taken");
        } else if (message.contains("email")) {
            errorResponse.put("message", "Email is already registered");
        } else {
            errorResponse.put("message", "Database error occurred");
        }
        
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthenticationException(AuthenticationException e) {
        Map<String, String> errorResponse = new HashMap<>();
        if (e instanceof BadCredentialsException) {
            errorResponse.put("message", "Invalid username or password");
        } else {
            errorResponse.put("message", "Authentication failed");
        }
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception e) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "An unexpected error occurred");
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
