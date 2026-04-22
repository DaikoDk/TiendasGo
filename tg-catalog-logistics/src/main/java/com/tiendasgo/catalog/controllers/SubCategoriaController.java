package com.tiendasgo.catalog.controllers;

import com.tiendasgo.catalog.dto.request.SubCategoriaRequest;
import com.tiendasgo.catalog.dto.response.SubCategoriaResponse;
import com.tiendasgo.catalog.services.ISubCategoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalog/sub-categorias")
@RequiredArgsConstructor
@Validated
public class SubCategoriaController {

    private final ISubCategoriaService subCategoriaService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar() {
        List<SubCategoriaResponse> data = subCategoriaService.listarTodos();
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("message", "Subcategorias listadas");
        body.put("data", data);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtener(@PathVariable Long id) {
        SubCategoriaResponse data = subCategoriaService.obtenerPorId(id);
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("message", "Subcategoria obtenida");
        body.put("data", data);
        return ResponseEntity.ok(body);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@Valid @RequestBody SubCategoriaRequest req) {
        SubCategoriaResponse created = subCategoriaService.crear(req);
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("message", "Subcategoria creada");
        body.put("data", created);
        return ResponseEntity.created(URI.create("/api/catalog/sub-categorias/" + created.getId())).body(body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizar(@PathVariable Long id, @Valid @RequestBody SubCategoriaRequest req) {
        SubCategoriaResponse updated = subCategoriaService.actualizar(id, req);
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("message", "Subcategoria actualizada");
        body.put("data", updated);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        subCategoriaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

