package com.tiendasgo.catalog.controllers;

import com.tiendasgo.catalog.dto.request.CategoriaRequest;
import com.tiendasgo.catalog.dto.response.CategoriaResponse;
import com.tiendasgo.catalog.services.ICategoriaService;
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
@RequestMapping("/api/catalog/categorias")
@RequiredArgsConstructor
@Validated
public class CategoriaController {

	private final ICategoriaService categoriaService;

	@GetMapping
	public ResponseEntity<Map<String, Object>> listar() {
		List<CategoriaResponse> data = categoriaService.listarTodos();
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", Instant.now().toString());
		body.put("message", "Categorias listadas");
		body.put("data", data);
		return ResponseEntity.ok(body);
	}

	@GetMapping("/{id}")
	public ResponseEntity<Map<String, Object>> obtener(@PathVariable Integer id) {
		CategoriaResponse data = categoriaService.obtenerPorId(id);
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", Instant.now().toString());
		body.put("message", "Categoria obtenida");
		body.put("data", data);
		return ResponseEntity.ok(body);
	}

	@PostMapping
	public ResponseEntity<Map<String, Object>> crear(@Valid @RequestBody CategoriaRequest req) {
		CategoriaResponse created = categoriaService.crear(req);
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", Instant.now().toString());
		body.put("message", "Categoria creada");
		body.put("data", created);
		return ResponseEntity.created(URI.create("/api/catalog/categorias/" + created.getId())).body(body);
	}

	@PutMapping("/{id}")
	public ResponseEntity<Map<String, Object>> actualizar(@PathVariable Integer id, @Valid @RequestBody CategoriaRequest req) {
		CategoriaResponse updated = categoriaService.actualizar(id, req);
		Map<String, Object> body = new HashMap<>();
		body.put("timestamp", Instant.now().toString());
		body.put("message", "Categoria actualizada");
		body.put("data", updated);
		return ResponseEntity.ok(body);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> eliminar(@PathVariable Integer id, @RequestParam(name = "force", required = false, defaultValue = "false") boolean force) {
		categoriaService.eliminar(id, force);
		return ResponseEntity.noContent().build();
	}
}


