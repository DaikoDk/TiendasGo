package com.tiendasgo.auth.controllers;

import com.tiendasgo.auth.dto.request.SedeRequest;
import com.tiendasgo.auth.dto.response.ApiResponse;
import com.tiendasgo.auth.dto.response.SedeResponse;
import com.tiendasgo.auth.services.ISedeService;
import com.tiendasgo.auth.utils.ApiPaths;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.API_SEDES)
@RequiredArgsConstructor
public class SedeController {

    private final ISedeService sedeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SedeResponse>>> listarSedes() {
        return ResponseEntity.ok(ApiResponse.success("Sedes obtenidas correctamente", sedeService.listarSedes()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SedeResponse>> obtenerSede(@PathVariable("id") Integer idSede) {
        return ResponseEntity.ok(ApiResponse.success("Sede obtenida correctamente", sedeService.obtenerSedePorId(idSede)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SedeResponse>> crearSede(@Valid @RequestBody SedeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Sede creada correctamente", sedeService.crearSede(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SedeResponse>> actualizarSede(
        @PathVariable("id") Integer idSede,
        @Valid @RequestBody SedeRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Sede actualizada correctamente", sedeService.actualizarSede(idSede, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> eliminarSede(@PathVariable("id") Integer idSede) {
        sedeService.eliminarSede(idSede);
        return ResponseEntity.ok(ApiResponse.success("Sede desactivada correctamente", null));
    }
}

