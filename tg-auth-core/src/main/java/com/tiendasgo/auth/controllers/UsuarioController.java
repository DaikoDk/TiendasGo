package com.tiendasgo.auth.controllers;
import com.tiendasgo.auth.dto.request.UsuarioGerenteRequest;
import com.tiendasgo.auth.dto.response.ApiResponse;
import com.tiendasgo.auth.dto.response.UsuarioResponse;
import com.tiendasgo.auth.services.IUsuarioService;
import com.tiendasgo.auth.utils.ApiPaths;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping(ApiPaths.API_USUARIOS)
@RequiredArgsConstructor
public class UsuarioController {
    private final IUsuarioService usuarioService;
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UsuarioResponse>>> listarUsuarios(
        @RequestParam(value = "rol", required = false) String rol
    ) {
        return ResponseEntity.ok(ApiResponse.success("Usuarios obtenidos correctamente", usuarioService.listarUsuarios(rol)));
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UsuarioResponse>> obtenerUsuario(@PathVariable("id") Integer idUsuario) {
        return ResponseEntity.ok(ApiResponse.success("Usuario obtenido correctamente", usuarioService.obtenerUsuarioPorId(idUsuario)));
    }
    @GetMapping("/gerentes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UsuarioResponse>>> listarGerentes() {
        return ResponseEntity.ok(ApiResponse.success("Gerentes obtenidos correctamente", usuarioService.listarGerentes()));
    }
    @GetMapping("/gerentes/dropdown")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UsuarioResponse>>> listarGerentesDropdown() {
        return ResponseEntity.ok(ApiResponse.success("Gerentes activos obtenidos correctamente", usuarioService.listarGerentesActivos()));
    }
    @PostMapping("/gerentes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UsuarioResponse>> crearGerente(@Valid @RequestBody UsuarioGerenteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Gerente creado correctamente", usuarioService.crearGerente(request)));
    }
    @PutMapping("/gerentes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UsuarioResponse>> actualizarGerente(
        @PathVariable("id") Integer idGerente,
        @Valid @RequestBody UsuarioGerenteRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Gerente actualizado correctamente", usuarioService.actualizarGerente(idGerente, request)));
    }
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UsuarioResponse>> actualizarEstado(
        @PathVariable("id") Integer idUsuario,
        @RequestParam("activo") Boolean activo
    ) {
        return ResponseEntity.ok(ApiResponse.success("Estado del usuario actualizado correctamente", usuarioService.actualizarEstado(idUsuario, activo)));
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> eliminarUsuario(@PathVariable("id") Integer idUsuario) {
        usuarioService.eliminarUsuario(idUsuario);
        return ResponseEntity.ok(ApiResponse.success("Usuario desactivado correctamente", null));
    }
}