package com.tiendasgo.catalog.dto.response;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MarcaResponse {
    private Long id;
    private String nombre;
    private String codigoMarca;
    private Boolean activo;
}

