package com.tiendasgo.auth.controllers;

import com.tiendasgo.auth.dto.response.SedeResponse;
import com.tiendasgo.auth.services.ISedeService;
import com.tiendasgo.auth.utils.ApiPaths;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.API_SEDES)
@RequiredArgsConstructor
public class SedeController {

    private final ISedeService sedeService;

    @GetMapping
    public ResponseEntity<List<SedeResponse>> listarSedes() {
        return ResponseEntity.ok(sedeService.listarSedes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SedeResponse> obtenerSede(@PathVariable("id") Integer idSede) {
        return ResponseEntity.ok(sedeService.obtenerSedePorId(idSede));
    }
}

