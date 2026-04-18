package com.tiendasgo.auth.services.impl;

import com.tiendasgo.auth.domain.repository.RolRepository;
import com.tiendasgo.auth.dto.response.RolResponse;
import com.tiendasgo.auth.services.IRolService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RolServiceImpl implements IRolService {

    private final RolRepository rolRepository;

    @Override
    public List<RolResponse> listarRoles() {
        return rolRepository.findAllByEstadoTrueOrderByNombreAsc().stream()
            .map(rol -> new RolResponse(
                rol.getIdRol(),
                rol.getNombre(),
                rol.getDescripcion(),
                rol.getEstado()
            ))
            .toList();
    }
}

