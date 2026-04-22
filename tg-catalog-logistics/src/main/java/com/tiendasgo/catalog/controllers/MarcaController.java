package com.tiendasgo.catalog.controllers;

import com.tiendasgo.catalog.dto.request.MarcaRequest;
import com.tiendasgo.catalog.dto.response.MarcaResponse;
import com.tiendasgo.catalog.services.IMarcaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/catalog/marcas")
@RequiredArgsConstructor
@Validated
public class MarcaController {

    private final IMarcaService marcaService;

    @GetMapping
    public ResponseEntity<List<MarcaResponse>> listar() {
        return ResponseEntity.ok(marcaService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MarcaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(marcaService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<MarcaResponse> crear(@Valid @RequestBody MarcaRequest req) {
        MarcaResponse created = marcaService.crear(req);
        return ResponseEntity.created(URI.create("/api/catalog/marcas/" + created.getId())).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MarcaResponse> actualizar(@PathVariable Long id, @Valid @RequestBody MarcaRequest req) {
        return ResponseEntity.ok(marcaService.actualizar(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        marcaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

