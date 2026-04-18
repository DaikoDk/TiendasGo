package com.tiendasgo.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolRequest {

    @NotBlank(message = "El nombre del rol es obligatorio")
    @Size(max = 50, message = "El nombre del rol no debe exceder 50 caracteres")
    private String nombre;

    @Size(max = 255, message = "La descripcion no debe exceder 255 caracteres")
    private String descripcion;

    private Boolean estado;
}
