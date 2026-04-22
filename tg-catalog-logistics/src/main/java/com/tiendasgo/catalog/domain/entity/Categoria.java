package com.tiendasgo.catalog.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import com.tiendasgo.catalog.domain.entity.SubCategoria;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "categorias", schema = "catalog", uniqueConstraints = {
        @UniqueConstraint(columnNames = "nombre"),
        @UniqueConstraint(columnNames = "prefijo")
})
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria")
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;

    @Column(name = "prefijo", length = 3, columnDefinition = "CHAR(3)")
    private String prefijo;


    @Column(name = "estado")
    private Boolean activo;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "categoria", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private List<SubCategoria> subCategorias = new ArrayList<>();
}


