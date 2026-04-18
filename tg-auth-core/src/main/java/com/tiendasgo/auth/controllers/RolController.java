package com.tiendasgo.auth.controllers;
import com.tiendasgo.auth.dto.response.ApiResponse;
import com.tiendasgo.auth.dto.response.RolResponse;
import com.tiendasgo.auth.services.IRolService;
import com.tiendasgo.auth.utils.ApiPaths;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping(ApiPaths.API_ROLES)
@RequiredArgsConstructor
public class RolController {
    private final IRolService rolService;
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RolResponse>>> listarRoles() {
        return ResponseEntity.ok(ApiResponse.success("Roles obtenidos correctamente", rolService.listarRoles()));
    }
}