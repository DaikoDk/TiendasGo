package com.tiendasgo.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SubCategoriaRequest {

    @NotBlank
    @Size(max = 50)
    private String nombre;

    @NotNull
    private Integer idCategoria;
}

