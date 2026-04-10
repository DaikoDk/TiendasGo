-- REGLA: Usa siempre el esquema 'auth'. No inventes tablas fuera de este script.

USE
TiendasGo;
GO

-- =============================================
-- CREACIÓN DE ESQUEMAS (SCHEMAS)
-- =============================================
CREATE SCHEMA auth; -- Microservicio: tg-auth-core
GO
CREATE SCHEMA catalog; -- Microservicio: tg-catalog-logistics
GO
CREATE SCHEMA purchases; -- Microservicio: tg-purchases
GO

-- =============================================
-- 1. AUTH
-- =============================================

CREATE TABLE auth.config_empresa
(
    id_config        INT PRIMARY KEY IDENTITY(1,1),
    nombre_empresa   VARCHAR(100) NOT NULL,
    ruc              VARCHAR(11) UNIQUE,
    moneda           VARCHAR(3) DEFAULT 'PEN',
    ejercicio_fiscal INT,
    estado           BIT        DEFAULT 1
);

CREATE TABLE auth.sedes
(
    id_sede            INT PRIMARY KEY IDENTITY(1,1),
    nombre             VARCHAR(100) NOT NULL,
    email              VARCHAR(100),
    gerente_nombre     VARCHAR(100),
    direccion          VARCHAR(255),
    ubigeo             CHAR(6),
    telefono           VARCHAR(20),
    es_almacen_central BIT DEFAULT 0,
    estado             BIT DEFAULT 1,
    horario_config     VARCHAR(500)
) ON USER_DATA;

CREATE TABLE auth.roles
(
    id_rol      INT PRIMARY KEY IDENTITY(1,1),
    nombre      VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(255),
    estado      BIT DEFAULT 1
);

CREATE TABLE auth.usuarios
(
    id_usuario      INT PRIMARY KEY IDENTITY(1,1),
    id_rol          INT                 NOT NULL FOREIGN KEY REFERENCES auth.roles(id_rol),
    id_sede         INT                 NOT NULL FOREIGN KEY REFERENCES auth.sedes(id_sede),
    nombre_completo VARCHAR(100)        NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(500)        NOT NULL, -- Soporta BCrypt/Argon2
    estado          BIT      DEFAULT 1,
    fecha_creacion  DATETIME DEFAULT CURRENT_TIMESTAMP
) ON USER_DATA;

CREATE TABLE auth.permisos
(
    id_permiso  INT PRIMARY KEY IDENTITY(1,1),
    nombre      VARCHAR(100)       NOT NULL UNIQUE,
    codigo      VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(255),
    modulo      VARCHAR(50)        NOT NULL,
    estado      BIT DEFAULT 1
);

CREATE TABLE auth.permisos_rol
(
    id_permiso_rol   INT PRIMARY KEY IDENTITY(1,1),
    id_rol           INT NOT NULL FOREIGN KEY REFERENCES auth.roles(id_rol),
    id_permiso       INT NOT NULL FOREIGN KEY REFERENCES auth.permisos(id_permiso),
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth.permisos_usuario
(
    id_permiso_usuario INT PRIMARY KEY IDENTITY(1,1),
    id_usuario         INT         NOT NULL FOREIGN KEY REFERENCES auth.usuarios(id_usuario),
    id_permiso         INT         NOT NULL FOREIGN KEY REFERENCES auth.permisos(id_permiso),
    tipo_permiso       VARCHAR(20) NOT NULL, -- 'PERMITIR' o 'DENEGAR'
    fecha_asignacion   DATETIME DEFAULT CURRENT_TIMESTAMP,
    asignado_por       INT FOREIGN KEY REFERENCES auth.usuarios(id_usuario),
    motivo             VARCHAR(255)
) ON USER_DATA;

CREATE TABLE auth.auditoria_config
(
    id_auditoria   INT PRIMARY KEY IDENTITY(1,1),
    tipo_cambio    VARCHAR(50) NOT NULL,
    id_registro    BIGINT, -- BIGINT para soportar IDs de Kardex
    valor_anterior VARCHAR(1000),
    valor_nuevo    VARCHAR(1000),
    usuario_id     INT FOREIGN KEY REFERENCES auth.usuarios(id_usuario),
    fecha_cambio   DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo         VARCHAR(255)
) ON USER_DATA;
GO

-- =============================================
-- 2. CATALOG (Productos e Inventario)
-- =============================================

CREATE TABLE catalog.categorias
(
    id_categoria INT PRIMARY KEY IDENTITY(1,1),
    nombre       VARCHAR(50) NOT NULL UNIQUE,
    prefijo      CHAR(3) UNIQUE,
    estado       BIT DEFAULT 1
);

CREATE TABLE catalog.subcategorias
(
    id_subcategoria INT PRIMARY KEY IDENTITY(1,1),
    id_categoria    INT         NOT NULL FOREIGN KEY REFERENCES catalog.categorias(id_categoria),
    nombre          VARCHAR(50) NOT NULL,
    estado          BIT DEFAULT 1
);

CREATE TABLE catalog.marcas
(
    id_marca     INT PRIMARY KEY IDENTITY(1,1),
    nombre       VARCHAR(50) NOT NULL UNIQUE,
    codigo_marca CHAR(3) UNIQUE
);

CREATE TABLE catalog.productos
(
    id_producto     INT PRIMARY KEY IDENTITY(1,1),
    id_subcategoria INT                NOT NULL FOREIGN KEY REFERENCES catalog.subcategorias(id_subcategoria),
    id_marca        INT                NOT NULL FOREIGN KEY REFERENCES catalog.marcas(id_marca),
    nombre_base     VARCHAR(100)       NOT NULL,
    variante        VARCHAR(50),
    medida_valor    VARCHAR(10),
    medida_unidad   VARCHAR(5),
    sku             VARCHAR(50) UNIQUE NOT NULL,
    precio_costo    DECIMAL(19, 4)     NOT NULL,
    precio_venta    DECIMAL(19, 4)     NOT NULL,
    imagen_url      VARCHAR(255),
    estado          BIT DEFAULT 1
) ON USER_DATA;

CREATE TABLE catalog.impuestos
(
    id_impuesto   INT PRIMARY KEY IDENTITY(1,1),
    id_config     INT         NOT NULL FOREIGN KEY REFERENCES auth.config_empresa(id_config),
    nombre        VARCHAR(50) NOT NULL,
    codigo        VARCHAR(10) UNIQUE,
    porcentaje    DECIMAL(5, 2) DEFAULT 18.00,
    es_afecto     BIT           DEFAULT 1,
    vigente_desde DATE,
    vigente_hasta DATE,
    estado        BIT           DEFAULT 1
);

CREATE TABLE catalog.tipos_gasto
(
    id_tipo_gasto INT PRIMARY KEY IDENTITY(1,1),
    nombre        VARCHAR(50) NOT NULL,
    codigo        VARCHAR(10) UNIQUE,
    descripcion   VARCHAR(255),
    estado        BIT DEFAULT 1
);

CREATE TABLE catalog.gastos_producto
(
    id_gasto         INT PRIMARY KEY IDENTITY(1,1),
    id_producto      INT NOT NULL FOREIGN KEY REFERENCES catalog.productos(id_producto),
    id_tipo_gasto    INT NOT NULL FOREIGN KEY REFERENCES catalog.tipos_gasto(id_tipo_gasto),
    valor_fijo       DECIMAL(19, 4),
    valor_porcentaje DECIMAL(5, 2),
    vigente_desde    DATE DEFAULT CAST(GETDATE() AS DATE),
    vigente_hasta    DATE,
    estado           BIT  DEFAULT 1
) ON USER_DATA;

CREATE TABLE catalog.comisiones_config
(
    id_comision      INT PRIMARY KEY IDENTITY(1,1),
    id_sede          INT FOREIGN KEY REFERENCES auth.sedes(id_sede),
    id_categoria     INT FOREIGN KEY REFERENCES catalog.categorias(id_categoria),
    tipo_comision    VARCHAR(20) NOT NULL, -- 'FIJA', 'PORCENTAJE'
    valor_base       DECIMAL(19, 4),
    valor_porcentaje DECIMAL(5, 2),
    vigente_desde    DATE        NOT NULL,
    vigente_hasta    DATE,
    estado           BIT DEFAULT 1
) ON USER_DATA;

CREATE TABLE catalog.stock_sede
(
    id_stock     INT PRIMARY KEY IDENTITY(1,1),
    id_sede      INT NOT NULL FOREIGN KEY REFERENCES auth.sedes(id_sede),
    id_producto  INT NOT NULL FOREIGN KEY REFERENCES catalog.productos(id_producto),
    stock_actual DECIMAL(19, 4) DEFAULT 0,
    stock_minimo DECIMAL(19, 4) DEFAULT 5,
    stock_maximo DECIMAL(19, 4),
    CONSTRAINT UQ_Sede_Producto UNIQUE (id_sede, id_producto)
) ON USER_DATA;

CREATE TABLE catalog.kardex
(
    id_kardex            BIGINT PRIMARY KEY IDENTITY(1,1),
    id_sede              INT            NOT NULL FOREIGN KEY REFERENCES auth.sedes(id_sede),
    id_producto          INT            NOT NULL FOREIGN KEY REFERENCES catalog.productos(id_producto),
    id_usuario           INT            NOT NULL FOREIGN KEY REFERENCES auth.usuarios(id_usuario),
    tipo_movimiento      VARCHAR(20)    NOT NULL,
    cantidad             DECIMAL(19, 4) NOT NULL,
    fecha_movimiento     DATETIME DEFAULT CURRENT_TIMESTAMP,
    documento_referencia VARCHAR(50)
) ON USER_DATA;

-- =============================================
-- 3. PURCHASES (Proveedores y Compras)
-- =============================================

CREATE TABLE purchases.proveedores
(
    id_proveedor INT PRIMARY KEY IDENTITY(1,1),
    ruc          VARCHAR(11) UNIQUE,
    razon_social VARCHAR(255) NOT NULL
);

CREATE TABLE purchases.compras_encabezado
(
    id_compra       INT PRIMARY KEY IDENTITY(1,1),
    id_proveedor    INT            NOT NULL FOREIGN KEY REFERENCES purchases.proveedores(id_proveedor),
    id_sede_destino INT            NOT NULL FOREIGN KEY REFERENCES auth.sedes(id_sede),
    id_usuario      INT            NOT NULL FOREIGN KEY REFERENCES auth.usuarios(id_usuario),
    fecha_compra    DATETIME    DEFAULT CURRENT_TIMESTAMP,
    nro_factura     VARCHAR(50) UNIQUE,
    total_compra    DECIMAL(19, 4) NOT NULL,
    estado          VARCHAR(20) DEFAULT 'PENDIENTE'
) ON USER_DATA;

CREATE TABLE purchases.compras_detalle
(
    id_detalle             INT PRIMARY KEY IDENTITY(1,1),
    id_compra              INT            NOT NULL FOREIGN KEY REFERENCES purchases.compras_encabezado(id_compra),
    id_producto            INT            NOT NULL FOREIGN KEY REFERENCES catalog.productos(id_producto),
    cantidad               DECIMAL(19, 4) NOT NULL,
    precio_unitario_compra DECIMAL(19, 4) NOT NULL
) ON USER_DATA;


CREATE INDEX IX_Usuarios_IdRol ON auth.usuarios (id_rol);
CREATE INDEX IX_Usuarios_IdSede ON auth.usuarios (id_sede);
CREATE INDEX IX_Stock_IdSede ON catalog.stock_sede (id_sede);
CREATE INDEX IX_Kardex_Sede_Producto ON catalog.kardex (id_sede, id_producto);
CREATE INDEX IX_ComprasDetalle_IdCompra ON purchases.compras_detalle (id_compra);
GO