package com.tiendasgo.auth.utils;

import com.tiendasgo.auth.dto.response.SedeResponse;
import com.tiendasgo.auth.domain.entity.Sede;

public final class SedeMapper {

    private SedeMapper() {
    }

    public static SedeResponse toResponse(Sede sede) {
        String gerenteNombre = null;
        String gerenteEmail = null;
        Integer idGerente = null;
        
        if (sede.getGerente() != null) {
            idGerente = sede.getGerente().getIdUsuario();
            gerenteNombre = sede.getGerente().getNombreCompleto();
            gerenteEmail = sede.getGerente().getEmail();
        }
        
        return new SedeResponse(
            sede.getIdSede(),
            sede.getNombre(),
            sede.getEmail(),
            gerenteNombre,
            idGerente,
            gerenteEmail,
            sede.getDireccion(),
            sede.getUbigeo(),
            sede.getTelefono(),
            sede.getEsAlmacenCentral(),
            sede.getEstado(),
            sede.getHorarioConfig()
        );
    }
}
