package com.tiendasgo.auth.domain.repository;

import com.tiendasgo.auth.domain.entity.Rol;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolRepository extends JpaRepository<Rol, Integer> {

    Optional<Rol> findByNombreIgnoreCaseAndEstadoTrue(String nombre);

    List<Rol> findAllByEstadoTrueOrderByNombreAsc();
}

