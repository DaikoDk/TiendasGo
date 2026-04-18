package com.tiendasgo.auth.services;
import com.tiendasgo.auth.dto.response.RolResponse;
import java.util.List;
public interface IRolService {
    List<RolResponse> listarRoles();
}