package com.tiendasgo.auth.services.impl;

import com.tiendasgo.auth.dto.request.SedeRequest;
import com.tiendasgo.auth.dto.response.SedeResponse;
import com.tiendasgo.auth.domain.entity.Sede;
import com.tiendasgo.auth.domain.entity.Usuario;
import com.tiendasgo.auth.domain.repository.SedeRepository;
import com.tiendasgo.auth.domain.repository.UsuarioRepository;
import com.tiendasgo.auth.exceptions.CustomException;
import com.tiendasgo.auth.services.ISedeService;
import com.tiendasgo.auth.utils.SedeMapper;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SedeServiceImpl implements ISedeService {

    private final SedeRepository sedeRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SedeResponse> listarSedes() {
        return sedeRepository.findAll().stream()
            .map(SedeMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SedeResponse obtenerSedePorId(Integer idSede) {
        Sede sede = sedeRepository.findById(idSede)
            .orElseThrow(() -> new CustomException("Sede no encontrada", HttpStatus.NOT_FOUND));
        return SedeMapper.toResponse(sede);
    }

    @Override
    @Transactional
    public SedeResponse crearSede(SedeRequest request) {
        if (request.getIdGerente() == null) {
            throw new CustomException("Debe asignar un gerente a la sede", HttpStatus.BAD_REQUEST);
        }
        Sede sede = new Sede();
        aplicarDatosRequest(sede, request);
        sede = sedeRepository.save(sede);

        asignarGerenteASede(sede, request.getIdGerente());
        sede = sedeRepository.save(sede);

        return SedeMapper.toResponse(sede);
    }

    @Override
    @Transactional
    public SedeResponse actualizarSede(Integer idSede, SedeRequest request) {
        Sede sede = sedeRepository.findById(idSede)
            .orElseThrow(() -> new CustomException("Sede no encontrada", HttpStatus.NOT_FOUND));

        aplicarDatosRequest(sede, request);

        if (request.getIdGerente() != null) {
            asignarGerenteASede(sede, request.getIdGerente());
        } else {
            sede.setGerente(null);
        }

        return SedeMapper.toResponse(sedeRepository.save(sede));
    }

    @Override
    public String generarEmailSede(String nombreSede) {
        return generarEmailSedeUnico(nombreSede, null);
    }

    private void aplicarDatosRequest(Sede sede, SedeRequest request) {
        String nombreSede = normalizeText(request.getNombre());
        sede.setNombre(nombreSede);

        String emailSede = generarEmailSedeUnico(nombreSede, sede.getIdSede());
        sede.setEmail(emailSede);

        sede.setDireccion(normalizeText(request.getDireccion()));
        sede.setUbigeo(normalizeText(request.getUbigeo()));
        sede.setTelefono(normalizeText(request.getTelefono()));
        sede.setEsAlmacenCentral(request.getEsAlmacenCentral() != null
            ? request.getEsAlmacenCentral()
            : Boolean.FALSE);
        sede.setEstado(request.getEstado() != null ? request.getEstado() : Boolean.TRUE);
        sede.setHorarioConfig(normalizeText(request.getHorarioConfig()));
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }

    private String generarEmailSedeUnico(String nombreSede, Integer idSedeActual) {
        String baseEmail = generarEmailBase(nombreSede);
        String email = baseEmail;
        int sufijo = 1;

        while (true) {
            boolean existe = idSedeActual == null
                ? sedeRepository.existsByEmailIgnoreCase(email)
                : sedeRepository.existsByEmailIgnoreCaseAndIdSedeNot(email, idSedeActual);

            if (!existe) {
                return email;
            }

            sufijo++;
            int atPos = baseEmail.indexOf('@');
            email = baseEmail.substring(0, atPos) + sufijo + baseEmail.substring(atPos);
        }
    }

    private String generarEmailBase(String nombreSede) {
        String slug = slugSede(nombreSede);
        return "sede." + slug + "@tiendasgo.com";
    }

    private String slugSede(String nombreSede) {
        String normalizado = normalizeText(nombreSede);
        if (normalizado == null || normalizado.isBlank()) {
            return "sede";
        }

        String sinAcentos = Normalizer.normalize(normalizado, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");

        String limpio = sinAcentos
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9\\s]", " ")
            .replaceAll("\\s+", "")
            .trim();

        return limpio.isBlank() ? "sede" : limpio;
    }

    private Usuario resolveGerente(Integer idGerente) {
        if (idGerente == null) {
            return null;
        }

        Usuario gerente = usuarioRepository.findByIdUsuarioAndEstadoTrue(idGerente)
            .orElseThrow(() -> new CustomException("Gerente no encontrado", HttpStatus.BAD_REQUEST));

        String nombreRol = gerente.getRol() == null || gerente.getRol().getNombre() == null
            ? ""
            : gerente.getRol().getNombre().trim().toUpperCase(Locale.ROOT);
        boolean rolActivo = gerente.getRol() != null && Boolean.TRUE.equals(gerente.getRol().getEstado());

        if (!"GERENTE".equals(nombreRol) || !rolActivo) {
            throw new CustomException("El usuario asignado no tiene rol GERENTE activo", HttpStatus.BAD_REQUEST);
        }

        return gerente;
    }

    private void asignarGerenteASede(Sede sede, Integer idGerente) {
        Usuario gerente = resolveGerente(idGerente);

        Sede sedeAnterior = gerente.getSede();

        if (sedeAnterior != null &&
            sedeAnterior.getIdSede() != null &&
            !sedeAnterior.getIdSede().equals(sede.getIdSede())) {
            sedeAnterior.setGerente(null);
            sedeRepository.save(sedeAnterior);
        }

        sede.setGerente(gerente);
    }

    @Override
    @Transactional
    public void eliminarSede(Integer idSede) {
        Sede sede = sedeRepository.findById(idSede)
            .orElseThrow(() -> new CustomException("Sede no encontrada", HttpStatus.NOT_FOUND));

        if (usuarioRepository.countBySedeIdSedeAndEstadoTrue(idSede) > 0) {
            throw new CustomException("No se puede desactivar la sede porque tiene usuarios activos", HttpStatus.CONFLICT);
        }

        sede.setEstado(Boolean.FALSE);
        sedeRepository.save(sede);
    }
}
