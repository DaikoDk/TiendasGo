package com.tiendasgo.catalog.services.impl;

import com.tiendasgo.catalog.domain.entity.Categoria;
import com.tiendasgo.catalog.domain.entity.SubCategoria;
import com.tiendasgo.catalog.domain.repository.CategoriaRepository;
import com.tiendasgo.catalog.domain.repository.ProductoRepository;
import com.tiendasgo.catalog.domain.repository.SubCategoriaRepository;
import com.tiendasgo.catalog.dto.request.SubCategoriaRequest;
import com.tiendasgo.catalog.dto.response.SubCategoriaResponse;
import com.tiendasgo.catalog.exceptions.ActiveProductsException;
import com.tiendasgo.catalog.exceptions.DuplicateResourceException;
import com.tiendasgo.catalog.exceptions.CodigoMarcaExhaustedException;
import com.tiendasgo.catalog.exceptions.ResourceNotFoundException;
import com.tiendasgo.catalog.services.ISubCategoriaService;
import com.tiendasgo.catalog.utils.SubCategoriaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubCategoriaServiceImpl implements ISubCategoriaService {

    private final SubCategoriaRepository subCategoriaRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final SubCategoriaMapper subCategoriaMapper;

    @Override
    public List<SubCategoriaResponse> listarTodos() {
        return subCategoriaRepository.findAll().stream()
                .map(subCategoriaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SubCategoriaResponse obtenerPorId(Integer id) {
        SubCategoria s = subCategoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategoria no encontrada: " + id));
        return subCategoriaMapper.toResponse(s);
    }

    @Override
    @Transactional
    public SubCategoriaResponse crear(SubCategoriaRequest req) {
        // validar existencia de categoria padre
        Categoria parent = categoriaRepository.findById(req.getIdCategoria())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria padre no encontrada: " + req.getIdCategoria()));

        // validar duplicado por nombre dentro de la misma categoria
        if (subCategoriaRepository.findByNombreAndCategoriaId(req.getNombre(), req.getIdCategoria()).isPresent()) {
            throw new DuplicateResourceException("Ya existe una subcategoria con ese nombre en la categoria: " + req.getNombre());
        }

        SubCategoria s = subCategoriaMapper.toEntity(req);
        s.setCategoria(parent);
        s.setActivo(Boolean.TRUE);
        String prefijo = generatePrefijoCandidato(req.getNombre());
        s.setPrefijo(prefijo);
        SubCategoria saved = subCategoriaRepository.save(s);
        return subCategoriaMapper.toResponse(saved);
    }

    private static final Random RANDOM = new Random();

    private String generatePrefijoCandidato(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("El nombre no puede estar vacío para generar prefijo");
        }
        String norm = Normalizer.normalize(nombre.trim().toUpperCase(), Normalizer.Form.NFD)
                .replaceAll("[^A-Z0-9]", "");
        if (norm.length() < 3) {
            norm = String.format("%-3s", norm).replace(' ', 'X');
        }
        String base = norm.substring(0, 3);
        if (!subCategoriaRepository.existsByPrefijo(base)) {
            return base;
        }
        // Intentar rotar el tercer caracter con los caracteres únicos restantes
        LinkedHashSet<Character> unique = new LinkedHashSet<>();
        for (char c : norm.toCharArray()) unique.add(c);
        Iterator<Character> it = unique.iterator();
        char c1 = it.hasNext() ? it.next() : 'X';
        char c2 = it.hasNext() ? it.next() : 'X';
        // Saltar los dos primeros
        if (it.hasNext()) it.next();
        while (it.hasNext()) {
            char c3 = it.next();
            String candidate = "" + c1 + c2 + c3;
            if (!subCategoriaRepository.existsByPrefijo(candidate)) {
                return candidate;
            }
        }
        // Probar con sufijo numérico
        for (int i = 1; i <= 99; i++) {
            String prefix1 = String.valueOf(c1);
            String candidate = prefix1 + String.format("%02d", i);
            if (!subCategoriaRepository.existsByPrefijo(candidate)) {
                return candidate;
            }
        }
        // Random alfanumérico
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (int i = 0; i < 1000; i++) {
            String candidate = "" + chars.charAt(RANDOM.nextInt(chars.length()))
                    + chars.charAt(RANDOM.nextInt(chars.length()))
                    + chars.charAt(RANDOM.nextInt(chars.length()));
            if (!subCategoriaRepository.existsByPrefijo(candidate)) {
                return candidate;
            }
        }
        throw new CodigoMarcaExhaustedException("No se pudo generar un prefijo único para la subcategoría: " + nombre);
    }

    @Override
    @Transactional
    public SubCategoriaResponse actualizar(Integer id, SubCategoriaRequest req) {
        SubCategoria existing = subCategoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategoria no encontrada: " + id));

        Categoria parent = categoriaRepository.findById(req.getIdCategoria())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria padre no encontrada: " + req.getIdCategoria()));

        boolean nombreCambio = !existing.getNombre().equalsIgnoreCase(req.getNombre());
        if (nombreCambio && subCategoriaRepository.findByNombreAndCategoriaId(req.getNombre(), req.getIdCategoria()).isPresent()) {
            throw new DuplicateResourceException("Ya existe una subcategoria con ese nombre en la categoria: " + req.getNombre());
        }

        existing.setNombre(req.getNombre());
        existing.setCategoria(parent);
        if (nombreCambio) {
            String nuevoPrefijo = generatePrefijoCandidato(req.getNombre());
            existing.setPrefijo(nuevoPrefijo);
        }

        SubCategoria updated = subCategoriaRepository.save(existing);
        return subCategoriaMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        SubCategoria existing = subCategoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategoria no encontrada: " + id));

        if (productoRepository.existsBySubCategoriaIdAndEstadoTrue(id)) {
            throw new ActiveProductsException("No se puede desactivar la subcategoría porque tiene productos activos asociados.");
        }

        existing.setActivo(Boolean.FALSE);
        subCategoriaRepository.save(existing);
    }
}

