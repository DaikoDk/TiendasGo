package com.tiendasgo.auth.domain.repository;

import com.tiendasgo.auth.domain.entity.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    Optional<Usuario> findByIdUsuarioAndEstadoTrue(Integer idUsuario);

    Optional<Usuario> findByIdUsuarioAndRolNombreIgnoreCase(Integer idUsuario, String nombreRol);

    Optional<Usuario> findByIdUsuarioAndRolNombreIgnoreCaseAndEstadoTrue(Integer idUsuario, String nombreRol);

    List<Usuario> findAllByRolNombreIgnoreCase(String nombreRol);

    List<Usuario> findAllByRolNombreIgnoreCaseOrderByIdUsuarioAsc(String nombreRol);


    List<Usuario> findAllByRolNombreIgnoreCaseAndEstadoTrue(String nombreRol);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdUsuarioNot(String email, Integer idUsuario);

    @Query("select count(u) > 0 from Usuario u where lower(u.email) = lower(:email)")
    boolean existsEmail(@Param("email") String email);

    @Query("select count(u) > 0 from Usuario u where lower(u.email) = lower(:email) and u.idUsuario <> :idUsuario")
    boolean existsEmailForOtherUser(@Param("email") String email, @Param("idUsuario") Integer idUsuario);

    long countBySedeIdSedeAndEstadoTrue(Integer idSede);
}


