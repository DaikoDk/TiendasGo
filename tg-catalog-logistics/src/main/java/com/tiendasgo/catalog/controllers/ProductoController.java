package com.tiendasgo.catalog.controllers;

import com.tiendasgo.catalog.dto.request.ProductoRequest;
import com.tiendasgo.catalog.dto.response.ProductoResponse;
import com.tiendasgo.catalog.services.IProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/catalog/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final IProductoService productoService;

    @GetMapping
    public ResponseEntity<List<ProductoResponse>> listar() {
        return ResponseEntity.ok(productoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponse> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(productoService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crear(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoResponse> actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody ProductoRequest req) {
        return ResponseEntity.ok(productoService.actualizar(id, req));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> cambiarEstado(
            @PathVariable Integer id,
            @RequestParam Boolean activo) {
        productoService.cambiarEstado(id, activo);
        return ResponseEntity.noContent().build();
    }

}
