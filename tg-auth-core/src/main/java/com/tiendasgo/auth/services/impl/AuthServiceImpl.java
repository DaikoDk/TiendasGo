package com.tiendasgo.auth.services.impl;

import com.tiendasgo.auth.config.JwtProvider;
import com.tiendasgo.auth.dto.request.LoginRequest;
import com.tiendasgo.auth.dto.response.AuthResponse;
import com.tiendasgo.auth.domain.entity.Usuario;
import com.tiendasgo.auth.domain.repository.UsuarioRepository;
import com.tiendasgo.auth.exceptions.CustomException;
import com.tiendasgo.auth.services.IAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private final UsuarioRepository usuarioRepository;
    private final JwtProvider jwtProvider;

    @Override
    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new CustomException("Credenciales invalidas", HttpStatus.UNAUTHORIZED));

        if (!Boolean.TRUE.equals(usuario.getEstado())) {
            throw new CustomException("Usuario inactivo", HttpStatus.FORBIDDEN);
        }

        if (request.getPassword() == null || !request.getPassword().equals(usuario.getPasswordHash())) {
            throw new CustomException("Credenciales invalidas", HttpStatus.UNAUTHORIZED);
        }

        String token = jwtProvider.generateToken(usuario.getEmail());
        return new AuthResponse(
            token,
            usuario.getIdUsuario(),
            usuario.getEmail(),
            usuario.getNombreCompleto(),
            usuario.getRol().getNombre()
        );
    }
}
