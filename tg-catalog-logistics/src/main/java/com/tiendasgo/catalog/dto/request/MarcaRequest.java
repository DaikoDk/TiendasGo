package com.tiendasgo.catalog.dto.request;

import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MarcaRequest {

    @NotBlank
    @Size(max = 50)
    private String nombre;

    @Size(max = 3)
    private String codigoMarca;
}

