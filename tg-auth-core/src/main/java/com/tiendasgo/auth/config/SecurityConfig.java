package com.tiendasgo.auth.config;

import com.tiendasgo.auth.security.JwtAuthenticationFilter;
import com.tiendasgo.auth.security.JwtEntryPoint;
import com.tiendasgo.auth.utils.ApiPaths;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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
@EnableMethodSecurity
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
                        .requestMatchers(HttpMethod.POST, ApiPaths.API_AUTH + "/login").permitAll()
                        .requestMatchers(HttpMethod.POST, ApiPaths.API_AUTH + "/logout").authenticated()

                        // Sedes: solo ADMIN (incluye endpoints de lectura).
                        .requestMatchers(HttpMethod.GET, ApiPaths.API_SEDES, ApiPaths.API_SEDES + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, ApiPaths.API_SEDES).hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, ApiPaths.API_SEDES + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, ApiPaths.API_SEDES + "/**").hasRole("ADMIN")

                        // Usuarios y subrecurso gerentes: solo ADMIN.
                        .requestMatchers(HttpMethod.GET, ApiPaths.API_USUARIOS, ApiPaths.API_USUARIOS + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, ApiPaths.API_USUARIOS, ApiPaths.API_USUARIOS + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, ApiPaths.API_USUARIOS, ApiPaths.API_USUARIOS + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, ApiPaths.API_USUARIOS, ApiPaths.API_USUARIOS + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, ApiPaths.API_USUARIOS, ApiPaths.API_USUARIOS + "/**").hasRole("ADMIN")

                        // Roles: solo ADMIN (por ahora se expone listado).
                        .requestMatchers(HttpMethod.GET, ApiPaths.API_ROLES, ApiPaths.API_ROLES + "/**").hasRole("ADMIN")

                        // Catalog: solo ADMIN en todas las operaciones (incluye GET).
                        .requestMatchers(HttpMethod.GET, ApiPaths.API_CATALOG, ApiPaths.API_CATALOG + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, ApiPaths.API_CATALOG, ApiPaths.API_CATALOG + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, ApiPaths.API_CATALOG, ApiPaths.API_CATALOG + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, ApiPaths.API_CATALOG, ApiPaths.API_CATALOG + "/**").hasRole("ADMIN")

                        // Purchases: solo ADMIN en todas las operaciones (incluye GET).
                        .requestMatchers(HttpMethod.GET, ApiPaths.API_PURCHASES, ApiPaths.API_PURCHASES + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, ApiPaths.API_PURCHASES, ApiPaths.API_PURCHASES + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, ApiPaths.API_PURCHASES, ApiPaths.API_PURCHASES + "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, ApiPaths.API_PURCHASES, ApiPaths.API_PURCHASES + "/**").hasRole("ADMIN")

                        // Ejemplos para escalar RBAC en el futuro:
                        // .requestMatchers(HttpMethod.GET, ApiPaths.API_CATALOG + "/stock/**").hasAnyRole("ADMIN", "ALMACENERO")
                        // .requestMatchers(HttpMethod.POST, ApiPaths.API_PURCHASES + "/ventas/**").hasAnyRole("ADMIN", "VENDEDOR")
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

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Authorization para el JWT)
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control"));

        // Permitir que se envíen credenciales (cookies, auth headers)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}