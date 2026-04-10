package com.tiendasgo.auth.utils;

import com.tiendasgo.auth.dto.response.SedeResponse;
import com.tiendasgo.auth.domain.entity.Sede;

public final class SedeMapper {

    private SedeMapper() {
    }

    public static SedeResponse toResponse(Sede sede) {
        return new SedeResponse(
            sede.getIdSede(),
            sede.getNombre(),
            sede.getDireccion(),
            sede.getTelefono(),
            sede.getEstado()
        );
    }
}
