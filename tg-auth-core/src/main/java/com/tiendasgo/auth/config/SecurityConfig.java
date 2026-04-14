package com.tiendasgo.auth.config;

import com.tiendasgo.auth.security.JwtAuthenticationFilter;
import com.tiendasgo.auth.security.JwtEntryPoint;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtEntryPoint jwtEntryPoint;



    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtEntryPoint))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // En tu SecurityConfig.java
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout") // Endpoint para cerrar sesión
                        .addLogoutHandler((request, response, authentication) -> {
                            // Aquí podrías marcar el token en una "Blacklist" si usas Redis
                            // Por ahora, solo nos aseguramos de que el contexto quede vacío
                            SecurityContextHolder.clearContext();
                        })
                        .logoutSuccessHandler((request, response, authentication) -> {
                            // Respondemos con un 200 OK y un JSON en lugar de redireccionar
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.setContentType("application/json");
                            response.getWriter().write("{ \"message\": \"Cierre de sesión exitoso\" }");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // frontend
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Authorization para el JWT)
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control"));

        // Permitir que se envíen credenciales (cookies, auth headers)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}