package com.tiendasgo.auth.security;

import com.tiendasgo.auth.domain.entity.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.Locale;

public class UserDetailsCustom implements UserDetails {

    private final Usuario usuario;

    public UserDetailsCustom(Usuario usuario) {
        this.usuario = usuario;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String nombreRol = usuario.getRol() == null || usuario.getRol().getNombre() == null
            ? ""
            : usuario.getRol().getNombre().trim().toUpperCase(Locale.ROOT).replace(' ', '_');

        // Spring Security evalua hasRole("ADMIN") contra autoridades con formato ROLE_ADMIN.
        // Si en el futuro agregas nuevos roles en auth.roles, esta normalizacion los hace compatibles.
        return Collections.singletonList(
          new SimpleGrantedAuthority("ROLE_" + nombreRol)
        );
    }

    @Override
    public String getPassword() {
        return usuario.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return usuario.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return usuario.getEstado();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return usuario.getEstado();
    }

}
