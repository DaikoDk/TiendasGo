package com.tiendasgo.auth.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.StringJoiner;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "usuarios", schema = "auth")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_rol", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Rol rol;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_sede", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Sede sede;

    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;

    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 500)
    private String passwordHash;

    @Column(name = "estado")
    private Boolean estado;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<PermisoUsuario> permisosUsuario = new ArrayList<>();

    @OneToMany(mappedBy = "asignadoPor", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<PermisoUsuario> permisosAsignados = new ArrayList<>();

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<AuditoriaConfig> auditoriasConfig = new ArrayList<>();


    // Compatibilidad hacia atras para servicios/controladores que aun usan nombreCompleto.
    public String getNombreCompleto() {
        return new StringJoiner(" ")
            .add(nombres == null ? "" : nombres.trim())
            .add(apellidos == null ? "" : apellidos.trim())
            .toString()
            .trim();
    }

    public void setNombreCompleto(String nombreCompleto) {
        String valor = nombreCompleto == null ? "" : nombreCompleto.trim();
        if (valor.isBlank()) {
            this.nombres = "";
            this.apellidos = "";
            return;
        }

        int firstSpace = valor.indexOf(' ');
        if (firstSpace < 0) {
            this.nombres = valor;
            this.apellidos = "";
            return;
        }

        this.nombres = valor.substring(0, firstSpace).trim();
        this.apellidos = valor.substring(firstSpace + 1).trim();
    }
}

