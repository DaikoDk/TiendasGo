package com.tiendasgo.auth.domain.repository;

import com.tiendasgo.auth.domain.entity.Sede;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SedeRepository extends JpaRepository<Sede, Integer> {

	Optional<Sede> findFirstByEsAlmacenCentralTrueAndEstadoTrue();

	boolean existsByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCaseAndIdSedeNot(String email, Integer idSede);

	@EntityGraph(attributePaths = "gerente")
	List<Sede> findAll();
}
