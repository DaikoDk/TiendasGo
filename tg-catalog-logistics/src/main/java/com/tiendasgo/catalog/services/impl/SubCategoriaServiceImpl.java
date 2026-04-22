package com.tiendasgo.catalog.services.impl;

import com.tiendasgo.catalog.domain.entity.Categoria;
import com.tiendasgo.catalog.domain.entity.SubCategoria;
import com.tiendasgo.catalog.domain.repository.CategoriaRepository;
import com.tiendasgo.catalog.domain.repository.SubCategoriaRepository;
import com.tiendasgo.catalog.dto.request.SubCategoriaRequest;
import com.tiendasgo.catalog.dto.response.SubCategoriaResponse;
import com.tiendasgo.catalog.exceptions.DuplicateResourceException;
import com.tiendasgo.catalog.exceptions.ResourceNotFoundException;
import com.tiendasgo.catalog.services.ISubCategoriaService;
import com.tiendasgo.catalog.utils.SubCategoriaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubCategoriaServiceImpl implements ISubCategoriaService {

    private final SubCategoriaRepository subCategoriaRepository;
    private final CategoriaRepository categoriaRepository;
    private final SubCategoriaMapper subCategoriaMapper;

    @Override
    public List<SubCategoriaResponse> listarTodos() {
        return subCategoriaRepository.findAll().stream()
                .map(subCategoriaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SubCategoriaResponse obtenerPorId(Long id) {
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
        SubCategoria saved = subCategoriaRepository.save(s);
        return subCategoriaMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public SubCategoriaResponse actualizar(Long id, SubCategoriaRequest req) {
        SubCategoria existing = subCategoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategoria no encontrada: " + id));

        Categoria parent = categoriaRepository.findById(req.getIdCategoria())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria padre no encontrada: " + req.getIdCategoria()));

        if (!existing.getNombre().equalsIgnoreCase(req.getNombre()) && subCategoriaRepository.findByNombreAndCategoriaId(req.getNombre(), req.getIdCategoria()).isPresent()) {
            throw new DuplicateResourceException("Ya existe una subcategoria con ese nombre en la categoria: " + req.getNombre());
        }

        existing.setNombre(req.getNombre());
        existing.setCategoria(parent);

        SubCategoria updated = subCategoriaRepository.save(existing);
        return subCategoriaMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        SubCategoria existing = subCategoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubCategoria no encontrada: " + id));
        existing.setActivo(Boolean.FALSE);
        subCategoriaRepository.save(existing);
    }
}

