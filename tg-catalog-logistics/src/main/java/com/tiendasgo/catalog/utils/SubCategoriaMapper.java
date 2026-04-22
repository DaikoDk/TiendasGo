package com.tiendasgo.catalog.utils;

import com.tiendasgo.catalog.domain.entity.SubCategoria;
import com.tiendasgo.catalog.dto.request.SubCategoriaRequest;
import com.tiendasgo.catalog.dto.response.SubCategoriaResponse;
import org.springframework.stereotype.Component;

@Component
public class SubCategoriaMapper {

    public SubCategoria toEntity(SubCategoriaRequest req) {
        if (req == null) return null;
        SubCategoria s = SubCategoria.builder()
                .nombre(req.getNombre())
                .activo(Boolean.TRUE)
                .build();
        return s;
    }

    public SubCategoriaResponse toResponse(SubCategoria s) {
        if (s == null) return null;
        return SubCategoriaResponse.builder()
                .id(s.getId())
                .nombre(s.getNombre())
                .activo(s.getActivo())
                .categoriaId(s.getCategoria() != null ? s.getCategoria().getId() : null)
                .nombreCategoriaPadre(s.getCategoria() != null ? s.getCategoria().getNombre() : null)
                .build();
    }
}

