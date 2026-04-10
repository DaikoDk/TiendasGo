package com.tiendasgo.auth.services.impl;

import com.tiendasgo.auth.dto.response.SedeResponse;
import com.tiendasgo.auth.domain.entity.Sede;
import com.tiendasgo.auth.domain.repository.SedeRepository;
import com.tiendasgo.auth.exceptions.CustomException;
import com.tiendasgo.auth.services.ISedeService;
import com.tiendasgo.auth.utils.SedeMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SedeServiceImpl implements ISedeService {

    private final SedeRepository sedeRepository;

    @Override
    public List<SedeResponse> listarSedes() {
        return sedeRepository.findAll().stream()
            .map(SedeMapper::toResponse)
            .toList();
    }

    @Override
    public SedeResponse obtenerSedePorId(Integer idSede) {
        Sede sede = sedeRepository.findById(idSede)
            .orElseThrow(() -> new CustomException("Sede no encontrada", HttpStatus.NOT_FOUND));
        return SedeMapper.toResponse(sede);
    }
}
