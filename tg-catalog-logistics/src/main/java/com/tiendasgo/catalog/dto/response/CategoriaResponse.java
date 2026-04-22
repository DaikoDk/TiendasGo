package com.tiendasgo.catalog.dto.response;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CategoriaResponse {
    private Integer id;
    private String nombre;
    private String prefijo;
    private Boolean activo;
}

