package com.tiendasgo.auth.controllers;

import com.tiendasgo.auth.dto.request.LoginRequest;
import com.tiendasgo.auth.dto.response.ApiResponse;
import com.tiendasgo.auth.dto.response.AuthResponse;
import com.tiendasgo.auth.services.IAuthService;
import com.tiendasgo.auth.utils.ApiPaths;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.API_AUTH)
@RequiredArgsConstructor
public class AuthController {

    private final IAuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("Login exitoso", authResponse));
    }
}

