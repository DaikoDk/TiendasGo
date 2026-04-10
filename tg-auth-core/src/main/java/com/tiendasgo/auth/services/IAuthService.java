package com.tiendasgo.auth.services;

import com.tiendasgo.auth.dto.request.LoginRequest;
import com.tiendasgo.auth.dto.response.AuthResponse;

public interface IAuthService {

    AuthResponse login(LoginRequest request);
}

