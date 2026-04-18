package com.tiendasgo.auth.services.impl;

import com.tiendasgo.auth.domain.entity.Rol;
import com.tiendasgo.auth.domain.entity.Sede;
import com.tiendasgo.auth.domain.entity.Usuario;
import com.tiendasgo.auth.domain.repository.RolRepository;
import com.tiendasgo.auth.domain.repository.SedeRepository;
import com.tiendasgo.auth.domain.repository.UsuarioRepository;
import com.tiendasgo.auth.dto.request.UsuarioGerenteRequest;
import com.tiendasgo.auth.dto.response.UsuarioResponse;
import com.tiendasgo.auth.exceptions.CustomException;
import com.tiendasgo.auth.services.IUsuarioService;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements IUsuarioService {

	private static final String ROL_GERENTE = "GERENTE";
	private static final String EMAIL_DOMAIN = "@tiendasgo.com";

	private final UsuarioRepository usuarioRepository;
	private final RolRepository rolRepository;
	private final SedeRepository sedeRepository;
	private final PasswordEncoder passwordEncoder;

	@Override
	public List<UsuarioResponse> listarUsuarios(String rol) {
		List<Usuario> usuarios = (rol == null || rol.isBlank())
			? usuarioRepository.findAll()
			: usuarioRepository.findAllByRolNombreIgnoreCaseOrderByIdUsuarioAsc(rol.trim());

		return usuarios.stream()
			.map(this::toResponse)
			.toList();
	}

	@Override
	public UsuarioResponse obtenerUsuarioPorId(Integer idUsuario) {
		Usuario usuario = usuarioRepository.findById(idUsuario)
			.orElseThrow(() -> new CustomException("Usuario no encontrado", HttpStatus.NOT_FOUND));
		return toResponse(usuario);
	}

	@Override
	public List<UsuarioResponse> listarGerentes() {
		return usuarioRepository.findAllByRolNombreIgnoreCase(ROL_GERENTE).stream()
			.map(this::toResponse)
			.toList();
	}

	@Override
	public List<UsuarioResponse> listarGerentesActivos() {
		return usuarioRepository.findAllByRolNombreIgnoreCaseAndEstadoTrue(ROL_GERENTE).stream()
			.map(this::toResponse)
			.toList();
	}

	@Override
	@Transactional
	public UsuarioResponse crearGerente(UsuarioGerenteRequest request) {
		validarConfirmacionAdmin(request);

		String password = normalizeText(request.getPassword());
		if (password == null || password.isBlank()) {
			throw new CustomException("La contrasena es obligatoria", HttpStatus.BAD_REQUEST);
		}

		Rol rolGerente = rolRepository.findByNombreIgnoreCaseAndEstadoTrue(ROL_GERENTE)
			.orElseThrow(() -> new CustomException("No existe un rol GERENTE activo", HttpStatus.BAD_REQUEST));

		Sede sede = resolveSedePrincipal();

		Usuario gerente = new Usuario();
		gerente.setRol(rolGerente);
		gerente.setSede(sede);
		gerente.setNombreCompleto(buildNombreCompleto(request));
		gerente.setEmail(generarEmailGerenteDisponible(request.getNombres(), request.getApellidos(), null));
		gerente.setPasswordHash(passwordEncoder.encode(password));
		gerente.setEstado(request.getEstado() != null ? request.getEstado() : Boolean.TRUE);
		gerente.setFechaCreacion(LocalDateTime.now());

		Usuario gerenteGuardado = usuarioRepository.save(gerente);
		return toResponse(gerenteGuardado);
	}

	@Override
	@Transactional
	public UsuarioResponse actualizarGerente(Integer idGerente, UsuarioGerenteRequest request) {
		Usuario gerente = usuarioRepository.findByIdUsuarioAndRolNombreIgnoreCase(idGerente, ROL_GERENTE)
			.orElseThrow(() -> new CustomException("Gerente no encontrado", HttpStatus.NOT_FOUND));

		gerente.setNombreCompleto(buildNombreCompleto(request));
		gerente.setEmail(generarEmailGerenteDisponible(request.getNombres(), request.getApellidos(), idGerente));

		String password = normalizeText(request.getPassword());
		if (password != null && !password.isBlank()) {
			gerente.setPasswordHash(passwordEncoder.encode(password));
		}

		if (request.getEstado() != null) {
			gerente.setEstado(request.getEstado());
		}

		return toResponse(usuarioRepository.save(gerente));
	}

	@Override
	public UsuarioResponse actualizarEstado(Integer idUsuario, Boolean estado) {
		if (estado == null) {
			throw new CustomException("El estado es obligatorio", HttpStatus.BAD_REQUEST);
		}

		Usuario usuario = usuarioRepository.findById(idUsuario)
			.orElseThrow(() -> new CustomException("Usuario no encontrado", HttpStatus.NOT_FOUND));
		usuario.setEstado(estado);
		return toResponse(usuarioRepository.save(usuario));
	}

	@Override
	public void eliminarUsuario(Integer idUsuario) {
		Usuario usuario = usuarioRepository.findById(idUsuario)
			.orElseThrow(() -> new CustomException("Usuario no encontrado", HttpStatus.NOT_FOUND));
		usuario.setEstado(Boolean.FALSE);
		usuarioRepository.save(usuario);
	}


	private Sede resolveSedePrincipal() {
		return sedeRepository.findFirstByEsAlmacenCentralTrueAndEstadoTrue()
			.orElseThrow(() -> new CustomException("No existe una sede principal activa", HttpStatus.BAD_REQUEST));
	}

	private void validarConfirmacionAdmin(UsuarioGerenteRequest request) {
		String adminEmail = normalizeText(request.getAdminEmail());
		String adminPassword = normalizeText(request.getAdminPassword());

		if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
			throw new CustomException("Debes confirmar usuario y contrasena de ADMIN", HttpStatus.BAD_REQUEST);
		}

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		String emailToken = authentication == null ? null : normalizeText(authentication.getName());
		if (emailToken == null || emailToken.isBlank() || !emailToken.equalsIgnoreCase(adminEmail)) {
			throw new CustomException("La confirmacion ADMIN no coincide con la sesion actual", HttpStatus.FORBIDDEN);
		}

		Usuario admin = usuarioRepository.findByEmailIgnoreCase(adminEmail)
			.orElseThrow(() -> new CustomException("Credenciales ADMIN invalidas", HttpStatus.UNAUTHORIZED));

		boolean rolAdmin = admin.getRol() != null
			&& admin.getRol().getNombre() != null
			&& "ADMIN".equalsIgnoreCase(admin.getRol().getNombre().trim())
			&& Boolean.TRUE.equals(admin.getRol().getEstado());

		if (!Boolean.TRUE.equals(admin.getEstado()) || !rolAdmin
			|| !passwordEncoder.matches(adminPassword, admin.getPasswordHash())) {
			throw new CustomException("Credenciales ADMIN invalidas", HttpStatus.UNAUTHORIZED);
		}
	}

	private UsuarioResponse toResponse(Usuario usuario) {
		return new UsuarioResponse(
			usuario.getIdUsuario(),
			usuario.getNombreCompleto(),
			usuario.getEmail(),
			usuario.getRol() != null ? usuario.getRol().getNombre() : null,
			usuario.getSede() != null ? usuario.getSede().getIdSede() : null,
			usuario.getEstado(),
			usuario.getFechaCreacion()
		);
	}

	private String buildNombreCompleto(UsuarioGerenteRequest request) {
		String nombres = normalizeText(request.getNombres());
		String apellidos = normalizeText(request.getApellidos());
		return ((nombres == null ? "" : nombres) + " " + (apellidos == null ? "" : apellidos)).trim();
	}

	private String generarEmailGerenteDisponible(String nombres, String apellidos, Integer exceptId) {
		String base = generarBaseEmailGerente(nombres, apellidos);
		String email = base + EMAIL_DOMAIN;
		if (!existeEmail(email, exceptId)) {
			return email;
		}

		int sufijo = 2;
		while (true) {
			String candidato = base + "+" + sufijo + EMAIL_DOMAIN;
			if (!existeEmail(candidato, exceptId)) {
				return candidato;
			}
			sufijo++;
		}
	}

	private boolean existeEmail(String email, Integer exceptId) {
		if (exceptId == null) {
			return usuarioRepository.existsByEmailIgnoreCase(email);
		}
		return usuarioRepository.existsByEmailIgnoreCaseAndIdUsuarioNot(email, exceptId);
	}

	private String generarBaseEmailGerente(String nombres, String apellidos) {
		String nombresLimpios = normalizeForEmail(nombres);
		String apellidosLimpios = normalizeForEmail(apellidos).replace(" ", "");
		String primerNombre = nombresLimpios.isBlank() ? "usuario" : nombresLimpios.split(" ")[0];
		return primerNombre + "." + apellidosLimpios;
	}

	private String normalizeForEmail(String value) {
		String normalized = normalizeText(value);
		if (normalized == null || normalized.isBlank()) {
			return "";
		}

		String withoutAccents = Normalizer.normalize(normalized, Normalizer.Form.NFD)
			.replaceAll("\\p{M}", "");

		return withoutAccents
			.toLowerCase(Locale.ROOT)
			.replaceAll("[^a-z0-9\\s]", " ")
			.replaceAll("\\s+", " ")
			.trim();
	}

	private String normalizeText(String value) {
		return value == null ? null : value.trim();
	}
}

