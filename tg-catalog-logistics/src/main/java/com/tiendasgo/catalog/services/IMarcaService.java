package com.tiendasgo.catalog.services;

import com.tiendasgo.catalog.dto.request.MarcaRequest;
import com.tiendasgo.catalog.dto.response.MarcaResponse;

import java.util.List;

public interface IMarcaService {
    List<MarcaResponse> listarTodos();

    MarcaResponse obtenerPorId(Long id);

    MarcaResponse crear(MarcaRequest req);

    MarcaResponse actualizar(Long id, MarcaRequest req);

    void eliminar(Long id);
}

