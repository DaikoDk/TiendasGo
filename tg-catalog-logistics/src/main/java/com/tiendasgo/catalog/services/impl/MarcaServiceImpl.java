package com.tiendasgo.catalog.services.impl;

import com.tiendasgo.catalog.domain.entity.Marca;
import com.tiendasgo.catalog.domain.repository.MarcaRepository;
import com.tiendasgo.catalog.dto.request.MarcaRequest;
import com.tiendasgo.catalog.dto.response.MarcaResponse;
import com.tiendasgo.catalog.exceptions.CodigoMarcaExhaustedException;
import com.tiendasgo.catalog.exceptions.DuplicateResourceException;
import com.tiendasgo.catalog.exceptions.ResourceNotFoundException;
import com.tiendasgo.catalog.services.IMarcaService;
import com.tiendasgo.catalog.utils.MarcaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarcaServiceImpl implements IMarcaService {

    private final MarcaRepository marcaRepository;
    private final MarcaMapper marcaMapper;

    @Override
    public List<MarcaResponse> listarTodos() {
        return marcaRepository.findAll().stream()
                .map(marcaMapper::toResponse)
                .collect(Collectors.toList());
    }
    @Override
    public MarcaResponse obtenerPorId(Integer id) {
        Marca m = marcaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada: " + id));
        return marcaMapper.toResponse(m);
    }

    @Override
    @Transactional
    public MarcaResponse crear(MarcaRequest req) {
        if (marcaRepository.existsByNombre(req.getNombre())) {
            throw new DuplicateResourceException("Ya existe una marca con ese nombre: " + req.getNombre());
        }
        Marca m = marcaMapper.toEntity(req);

        if (m.getActivo() == null) {
            m.setActivo(true);
        }

        // Siempre generar codigo_marca en backend
        String codigo = generarCodigoPorNombre(req.getNombre());
        m.setCodigoMarca(codigo);
        Marca saved = marcaRepository.save(m);
        return marcaMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public MarcaResponse actualizar(Integer id, MarcaRequest req) {
        Marca existing = marcaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada: " + id));

        // si cambia el nombre, verificar duplicado
        boolean nombreCambio = !existing.getNombre().equalsIgnoreCase(req.getNombre());
        if (nombreCambio && marcaRepository.existsByNombre(req.getNombre())) {
            throw new DuplicateResourceException("Ya existe una marca con ese nombre: " + req.getNombre());
        }

        existing.setNombre(req.getNombre());
        if (nombreCambio) {
            String nuevoCodigo = generarCodigoPorNombre(req.getNombre());
            existing.setCodigoMarca(nuevoCodigo);
        }

        existing.setActivo(req.getActivo() != null ? req.getActivo() : existing.getActivo());

        Marca updated = marcaRepository.save(existing);
        return marcaMapper.toResponse(updated);
    }

    @Override
    public String generarCodigoPorNombre(String nombre) {
        return generateCodigoCandidate(nombre);
    }

    // Helpers
    private static final java.util.Random RND = new java.util.Random();

    private String normalizarBase(String nombre) {
        if (nombre == null) return "XXX";
        String base = nombre.strip().toUpperCase();
        base = java.text.Normalizer.normalize(base, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^A-Z0-9]", "");
        if (base.length() < 3) {
            base = String.format("%-3s", base).replace(' ', 'X');
        }
        return base;
    }

    private String generateCodigoCandidate(String nombre) {
        String base = normalizarBase(nombre);
        String candidate = base.substring(0, 3);

        // Intento natural
        if (!marcaRepository.existsByCodigoMarca(candidate)) return candidate;

        // Fallback semántico: mantener los 2 primeros chars, rotar el 3ro
        // con los caracteres restantes del propio nombre (sin repetir)
        String prefix = candidate.substring(0, 2);
        java.util.LinkedHashSet<Character> letrasRestantes = new java.util.LinkedHashSet<>();
        for (int i = 2; i < base.length(); i++) {
            letrasRestantes.add(base.charAt(i));
        }
        letrasRestantes.remove(candidate.charAt(2)); // ya se intentó

        for (char c : letrasRestantes) {
            String attempt = prefix + c;
            if (!marcaRepository.existsByCodigoMarca(attempt)) return attempt;
        }

        // Fallback numérico: prefijo 1 char + 2 dígitos  (bug corregido)
        String prefix1 = candidate.substring(0, 1);
        for (int i = 1; i <= 99; i++) {
            String attempt = prefix1 + String.format("%02d", i);
            if (!marcaRepository.existsByCodigoMarca(attempt)) return attempt;
        }

        // Último recurso: random alfanumérico
        for (int i = 0; i < 1000; i++) {
            StringBuilder b = new StringBuilder(3);
            for (int j = 0; j < 3; j++) {
                int r = RND.nextInt(36);
                b.append(r < 10 ? (char) ('0' + r) : (char) ('A' + (r - 10)));
            }
            String attempt = b.toString();
            if (!marcaRepository.existsByCodigoMarca(attempt)) return attempt;
        }

        throw new CodigoMarcaExhaustedException(
                "No se pudo generar un codigo_marca único para: " + nombre
        );
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        Marca existing = marcaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada: " + id));
        existing.setActivo(false);
        marcaRepository.save(existing);
    }
}

