package com.tiendasgo.catalog.dto.response;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SubCategoriaResponse {
    private Long id;
    private String nombre;
    private Boolean activo;
    private Integer categoriaId;
    private String nombreCategoriaPadre;
}

