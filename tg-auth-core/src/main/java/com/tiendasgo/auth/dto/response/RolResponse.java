package com.tiendasgo.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolResponse {

    private Integer idRol;
    private String nombre;
    private String descripcion;
    private Boolean estado;
}

