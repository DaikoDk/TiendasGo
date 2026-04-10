package com.tiendasgo.auth.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "config_empresa", schema = "auth")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfigEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_config")
    private Integer idConfig;

    @Column(name = "nombre_empresa", nullable = false, length = 100)
    private String nombreEmpresa;

    @Column(name = "ruc", length = 11)
    private String ruc;

    @Column(name = "moneda", length = 3)
    private String moneda;

    @Column(name = "ejercicio_fiscal")
    private Integer ejercicioFiscal;

    @Column(name = "estado")
    private Boolean estado;
}

