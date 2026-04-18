package com.tiendasgo.auth.services;

import com.tiendasgo.auth.dto.request.UsuarioGerenteRequest;
import com.tiendasgo.auth.dto.response.UsuarioResponse;
import java.util.List;

public interface IUsuarioService {

	List<UsuarioResponse> listarUsuarios(String rol);

	UsuarioResponse obtenerUsuarioPorId(Integer idUsuario);

	List<UsuarioResponse> listarGerentes();

	List<UsuarioResponse> listarGerentesActivos();

	UsuarioResponse crearGerente(UsuarioGerenteRequest request);

	UsuarioResponse actualizarGerente(Integer idGerente, UsuarioGerenteRequest request);

	UsuarioResponse actualizarEstado(Integer idUsuario, Boolean estado);

	void eliminarUsuario(Integer idUsuario);
}

