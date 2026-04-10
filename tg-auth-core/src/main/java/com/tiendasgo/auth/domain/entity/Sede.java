package com.tiendasgo.auth.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "sedes", schema = "auth")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sede {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sede")
    private Integer idSede;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "gerente_nombre", length = 100)
    private String gerenteNombre;

    @Column(name = "direccion", length = 255)
    private String direccion;

    @Column(name = "ubigeo", columnDefinition = "char(6)")
    private String ubigeo;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "es_almacen_central")
    private Boolean esAlmacenCentral;

    @Column(name = "estado")
    private Boolean estado;

    @Column(name = "horario_config", length = 500)
    private String horarioConfig;

    @OneToMany(mappedBy = "sede", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Usuario> usuarios = new ArrayList<>();
}
