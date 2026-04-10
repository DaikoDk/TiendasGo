package com.tiendasgo.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SedeResponse {

    private Integer idSede;
    private String nombre;
    private String direccion;
    private String telefono;
    private Boolean estado;
}

