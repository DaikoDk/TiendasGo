package com.tiendasgo.catalog.utils;

import com.tiendasgo.catalog.domain.entity.Marca;
import com.tiendasgo.catalog.dto.request.MarcaRequest;
import com.tiendasgo.catalog.dto.response.MarcaResponse;
import org.springframework.stereotype.Component;

@Component
public class MarcaMapper {

    public Marca toEntity(MarcaRequest req) {
        if (req == null) return null;
        return Marca.builder()
                .nombre(req.getNombre())
                .codigoMarca(req.getCodigoMarca())
                .activo(Boolean.TRUE)
                .build();
    }

    public MarcaResponse toResponse(Marca m) {
        if (m == null) return null;
        return MarcaResponse.builder()
                .id(m.getId())
                .nombre(m.getNombre())
                .codigoMarca(m.getCodigoMarca())
                .activo(m.getActivo())
                .build();
    }
}

