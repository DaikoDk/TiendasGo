package com.tiendasgo.catalog.services;

import com.tiendasgo.catalog.dto.request.SubCategoriaRequest;
import com.tiendasgo.catalog.dto.response.SubCategoriaResponse;

import java.util.List;

public interface ISubCategoriaService {
    List<SubCategoriaResponse> listarTodos();

    SubCategoriaResponse obtenerPorId(Long id);

    SubCategoriaResponse crear(SubCategoriaRequest req);

    SubCategoriaResponse actualizar(Long id, SubCategoriaRequest req);

    void eliminar(Long id);
}

