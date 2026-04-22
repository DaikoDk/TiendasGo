package com.tiendasgo.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CategoriaRequest {

    @NotBlank
    @Size(max = 50)
    private String nombre;

    @Size(max = 3)
    private String prefijo;
}

