package com.tiendasgo.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private Integer userId;
    private String email;
    private String nombreCompleto;
    private String rol;
}

