package com.tiendasgo.auth.dto.request;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.tiendasgo.auth.validation.ValidHorarioConfig;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SedeRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no debe exceder 100 caracteres")
    private String nombre;

    @Email(message = "El email debe tener un formato valido")
    @Size(max = 100, message = "El email no debe exceder 100 caracteres")
    private String email;

    @Size(max = 100, message = "El nombre del gerente no debe exceder 100 caracteres")
    private String gerenteNombre;

    @Positive(message = "El idGerente debe ser mayor a cero")
    private Integer idGerente;

    @NotBlank(message = "El email del gerente es obligatorio")
    @Email(message = "El email del gerente debe tener un formato valido")
    @Size(max = 100, message = "El email del gerente no debe exceder 100 caracteres")
    private String gerenteEmail;

    @Size(max = 255, message = "La direccion no debe exceder 255 caracteres")
    @Size(max = 255, message = "La direccion no debe exceder 255 caracteres")
    private String direccion;

    @Size(min = 6, max = 6, message = "El ubigeo debe tener 6 caracteres")
    @Pattern(regexp = "^\\d{6}$", message = "El ubigeo debe contener solo 6 dígitos")
    private String ubigeo;

    @Size(max = 20, message = "El telefono no debe exceder 20 caracteres")
    private String telefono;

    private Boolean esAlmacenCentral;

    private Boolean estado;

    @JsonDeserialize(using = HorarioConfigStringDeserializer.class)
    @ValidHorarioConfig
    @Size(max = 500, message = "La configuracion de horario no debe exceder 500 caracteres")
    private String horarioConfig;
}

