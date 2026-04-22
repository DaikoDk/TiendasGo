package com.tiendasgo.catalog.services;

import com.tiendasgo.catalog.dto.request.CategoriaRequest;
import com.tiendasgo.catalog.dto.response.CategoriaResponse;

import java.util.List;

public interface ICategoriaService {
    List<CategoriaResponse> listarTodos();

    CategoriaResponse obtenerPorId(Integer id);

    CategoriaResponse crear(CategoriaRequest req);

    CategoriaResponse actualizar(Integer id, CategoriaRequest req);

    void eliminar(Integer id, boolean force);
}

