package com.tiendasgo.auth.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponse {

	private Integer idUsuario;
	private String nombreCompleto;
	private String email;
	private String rol;
	private Integer idSede;
	private Boolean estado;
	private LocalDateTime fechaCreacion;
}

