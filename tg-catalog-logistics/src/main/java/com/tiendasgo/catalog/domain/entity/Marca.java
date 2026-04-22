package com.tiendasgo.catalog.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "marcas", schema = "catalog")
public class Marca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_marca")
    private Long id;

    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;

    @Column(name = "codigo_marca", length = 3)
    private String codigoMarca;

    @Column(name = "estado")
    private Boolean activo;
}


