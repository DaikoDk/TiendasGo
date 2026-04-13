package com.tiendasgo.auth.services.impl;

import com.tiendasgo.auth.security.JwtProvider;
import com.tiendasgo.auth.dto.request.LoginRequest;
import com.tiendasgo.auth.dto.response.AuthResponse;
import com.tiendasgo.auth.domain.entity.Usuario;
import com.tiendasgo.auth.domain.repository.UsuarioRepository;
import com.tiendasgo.auth.exceptions.CustomException;
import com.tiendasgo.auth.security.UserDetailsCustom;
import com.tiendasgo.auth.services.IAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private final UsuarioRepository usuarioRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new CustomException("Credenciales invalidas", HttpStatus.UNAUTHORIZED));

        if (!Boolean.TRUE.equals(usuario.getEstado())) {
            throw new CustomException("Usuario inactivo", HttpStatus.FORBIDDEN);
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
            throw new CustomException("Credenciales invalidas", HttpStatus.UNAUTHORIZED);
        }

        UserDetails userDetails = new UserDetailsCustom(usuario);

        String token = jwtProvider.generateToken(userDetails);

        return new AuthResponse(
            token,
            usuario.getIdUsuario(),
            usuario.getEmail(),
            usuario.getNombreCompleto(),
            usuario.getRol().getNombre()
        );
    }
}
