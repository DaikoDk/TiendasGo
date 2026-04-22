package com.tiendasgo.catalog.utils;

import com.tiendasgo.catalog.domain.entity.Categoria;
import com.tiendasgo.catalog.dto.request.CategoriaRequest;
import com.tiendasgo.catalog.dto.response.CategoriaResponse;
import org.springframework.stereotype.Component;

@Component
public class CategoriaMapper {

    public Categoria toEntity(CategoriaRequest req) {
        if (req == null) return null;
        return Categoria.builder()
                .nombre(req.getNombre())
                .prefijo(req.getPrefijo())
                .activo(Boolean.TRUE)
                .build();
    }

    public CategoriaResponse toResponse(Categoria c) {
        if (c == null) return null;
        return CategoriaResponse.builder()
                .id(c.getId())
                .nombre(c.getNombre())
                .prefijo(c.getPrefijo())
                .activo(c.getActivo())
                .build();
    }
}

