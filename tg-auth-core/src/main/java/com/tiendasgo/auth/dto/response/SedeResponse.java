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
    private String email;
    private String gerenteNombre;
    private Integer idGerente;
    private String gerenteEmail;
    private String direccion;
    private String ubigeo;
    private String telefono;
    private Boolean esAlmacenCentral;
    private Boolean estado;
    private String horarioConfig;
}

