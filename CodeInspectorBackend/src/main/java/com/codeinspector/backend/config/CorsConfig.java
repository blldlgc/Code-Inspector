package com.codeinspector.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${cors.allowed-headers:*}")
    private String allowedHeaders;

    @Value("${cors.exposed-headers:Authorization}")
    private String exposedHeaders;

    @Value("${cors.max-age:3600}")
    private long maxAge;

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Origins - allowCredentials = true olduğunda setAllowedOriginPatterns kullan
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        config.setAllowedOriginPatterns(origins);
        
        // Methods
        List<String> methods = Arrays.asList(allowedMethods.split(","));
        config.setAllowedMethods(methods);
        
        // Headers - "*" yerine spesifik header'ları kullan
        if (!"*".equals(allowedHeaders)) {
        List<String> headers = Arrays.asList(allowedHeaders.split(","));
        config.setAllowedHeaders(headers);
        } else {
            // allowCredentials = true olduğunda "*" kullanılamaz, spesifik header'ları ekle
            config.addAllowedHeader("Authorization");
            config.addAllowedHeader("Content-Type");
            config.addAllowedHeader("X-Requested-With");
            config.addAllowedHeader("Accept");
            config.addAllowedHeader("Origin");
            config.addAllowedHeader("Access-Control-Request-Method");
            config.addAllowedHeader("Access-Control-Request-Headers");
        }
        
        // Exposed Headers
        List<String> exposed = Arrays.asList(exposedHeaders.split(","));
        config.setExposedHeaders(exposed);
        
        // Other settings
        config.setAllowCredentials(true);
        config.setMaxAge(maxAge);
        
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }
}


