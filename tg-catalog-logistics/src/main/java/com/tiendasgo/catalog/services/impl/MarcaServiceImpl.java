package com.tiendasgo.catalog.services.impl;

import com.tiendasgo.catalog.domain.entity.Marca;
import com.tiendasgo.catalog.domain.repository.MarcaRepository;
import com.tiendasgo.catalog.dto.request.MarcaRequest;
import com.tiendasgo.catalog.dto.response.MarcaResponse;
import com.tiendasgo.catalog.exceptions.DuplicateResourceException;
import com.tiendasgo.catalog.exceptions.ResourceNotFoundException;
import com.tiendasgo.catalog.services.IMarcaService;
import com.tiendasgo.catalog.utils.MarcaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarcaServiceImpl implements IMarcaService {

    private final MarcaRepository marcaRepository;
    private final MarcaMapper marcaMapper;

    @Override
    public List<MarcaResponse> listarTodos() {
        return marcaRepository.findAll().stream()
                .map(marcaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public MarcaResponse obtenerPorId(Long id) {
        Marca m = marcaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada: " + id));
        return marcaMapper.toResponse(m);
    }

    @Override
    @Transactional
    public MarcaResponse crear(MarcaRequest req) {
        if (marcaRepository.existsByNombre(req.getNombre())) {
            throw new DuplicateResourceException("Ya existe una marca con ese nombre: " + req.getNombre());
        }
        Marca m = marcaMapper.toEntity(req);
        m.setActivo(Boolean.TRUE);
        Marca saved = marcaRepository.save(m);
        return marcaMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public MarcaResponse actualizar(Long id, MarcaRequest req) {
        Marca existing = marcaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada: " + id));

        // si cambia el nombre, verificar duplicado
        if (!existing.getNombre().equalsIgnoreCase(req.getNombre()) && marcaRepository.existsByNombre(req.getNombre())) {
            throw new DuplicateResourceException("Ya existe una marca con ese nombre: " + req.getNombre());
        }

        existing.setNombre(req.getNombre());
        existing.setCodigoMarca(req.getCodigoMarca());

        Marca updated = marcaRepository.save(existing);
        return marcaMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        Marca existing = marcaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada: " + id));
        existing.setActivo(Boolean.FALSE);
        marcaRepository.save(existing);
    }
}

