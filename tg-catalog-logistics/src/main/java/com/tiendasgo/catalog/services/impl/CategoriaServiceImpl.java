package com.tiendasgo.catalog.services.impl;

import com.tiendasgo.catalog.domain.entity.Categoria;
import com.tiendasgo.catalog.domain.repository.CategoriaRepository;
import com.tiendasgo.catalog.dto.request.CategoriaRequest;
import com.tiendasgo.catalog.dto.response.CategoriaResponse;
import com.tiendasgo.catalog.exceptions.DuplicateResourceException;
import com.tiendasgo.catalog.exceptions.ActiveSubcategoriesException;
import com.tiendasgo.catalog.domain.repository.SubCategoriaRepository;
import com.tiendasgo.catalog.exceptions.ResourceNotFoundException;
import com.tiendasgo.catalog.services.ICategoriaService;
import com.tiendasgo.catalog.utils.CategoriaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoriaServiceImpl implements ICategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final CategoriaMapper categoriaMapper;
    private final SubCategoriaRepository subCategoriaRepository;

    @Override
    public List<CategoriaResponse> listarTodos() {
        return categoriaRepository.findAll().stream()
                .map(categoriaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CategoriaResponse obtenerPorId(Integer id) {
        Categoria c = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria no encontrada: " + id));
        return categoriaMapper.toResponse(c);
    }

    @Override
    @Transactional
    public CategoriaResponse crear(CategoriaRequest req) {
        if (categoriaRepository.existsByNombre(req.getNombre())) {
            throw new DuplicateResourceException("Ya existe una categoria con ese nombre: " + req.getNombre());
        }
        Categoria c = categoriaMapper.toEntity(req);
        c.setActivo(Boolean.TRUE);
        Categoria saved = categoriaRepository.save(c);
        return categoriaMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CategoriaResponse actualizar(Integer id, CategoriaRequest req) {
        Categoria existing = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria no encontrada: " + id));

        if (!existing.getNombre().equalsIgnoreCase(req.getNombre()) && categoriaRepository.existsByNombre(req.getNombre())) {
            throw new DuplicateResourceException("Ya existe una categoria con ese nombre: " + req.getNombre());
        }

        existing.setNombre(req.getNombre());
        existing.setPrefijo(req.getPrefijo());

        Categoria updated = categoriaRepository.save(existing);
        return categoriaMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void eliminar(Integer id, boolean force) {
        Categoria existing = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria no encontrada: " + id));

        // buscar subcategorías activas
        boolean hasActive = subCategoriaRepository.findByCategoriaId(id).stream()
                .anyMatch(sc -> Boolean.TRUE.equals(sc.getActivo()));

        if (hasActive && !force) {
            throw new ActiveSubcategoriesException("Existen subcategorías activas. Use force=true para forzar la desactivación.");
        }

        // inactivar subcategorías si force
        if (hasActive && force) {
            subCategoriaRepository.findByCategoriaId(id).forEach(sc -> {
                sc.setActivo(Boolean.FALSE);
                subCategoriaRepository.save(sc);
            });
        }

        existing.setActivo(Boolean.FALSE);
        categoriaRepository.save(existing);
    }
}

