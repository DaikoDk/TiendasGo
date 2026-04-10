package com.tiendasgo.auth.services;

import com.tiendasgo.auth.dto.response.SedeResponse;
import java.util.List;

public interface ISedeService {

    List<SedeResponse> listarSedes();

    SedeResponse obtenerSedePorId(Integer idSede);
}

