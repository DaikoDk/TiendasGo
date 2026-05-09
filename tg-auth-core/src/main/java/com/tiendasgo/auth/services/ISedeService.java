package com.tiendasgo.auth.services;

import com.tiendasgo.auth.dto.request.SedeRequest;
import com.tiendasgo.auth.dto.response.SedeResponse;
import java.util.List;

public interface ISedeService {

    List<SedeResponse> listarSedes();

    SedeResponse obtenerSedePorId(Integer idSede);

    SedeResponse crearSede(SedeRequest request);

    SedeResponse actualizarSede(Integer idSede, SedeRequest request);

    void eliminarSede(Integer idSede);

    String generarEmailSede(String nombreSede);
}

