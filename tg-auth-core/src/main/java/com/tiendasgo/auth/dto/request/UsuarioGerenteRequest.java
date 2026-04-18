package com.tiendasgo.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioGerenteRequest {

	@NotBlank(message = "Los nombres son obligatorios")
	@Size(max = 100, message = "Los nombres no deben exceder 100 caracteres")
	private String nombres;

	@NotBlank(message = "Los apellidos son obligatorios")
	@Size(max = 100, message = "Los apellidos no deben exceder 100 caracteres")
	private String apellidos;

	@Size(min = 8, max = 100, message = "La contrasena debe tener entre 8 y 100 caracteres")
	private String password;

	// En creacion de gerente se ignora y se usa sede principal por defecto.
	// Se mantiene opcional por compatibilidad.
	private Integer idSede;

	// Confirmacion de seguridad: credenciales ADMIN para crear gerente.
	private String adminEmail;
	private String adminPassword;

	private Boolean estado;
}

