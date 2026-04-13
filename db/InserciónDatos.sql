USE TiendasGo;
GO

-- 1. INSERTAR CONFIGURACIÓN DE EMPRESA
INSERT INTO auth.config_empresa (nombre_empresa, ruc, moneda, ejercicio_fiscal, estado)
VALUES ('TiendasGo S.A.C.', '20123456789', 'PEN', 2026, 1);

-- 2. INSERTAR SEDE INICIAL
INSERT INTO auth.sedes (nombre, email, gerente_nombre, direccion, es_almacen_central, estado)
VALUES ('SEDE CENTRAL - LIMA', 'central@tiendasgo.com', 'David Barrios', 'Av. Javier Prado 456', 1, 1);

-- 3. INSERTAR ROL ADMINISTRADOR
INSERT INTO auth.roles (nombre, descripcion, estado)
VALUES ('ADMIN', 'Acceso total a todos los módulos y gestión de seguridad', 1);

-- 4. INSERTAR PERMISOS BÁSICOS
INSERT INTO auth.permisos (nombre, codigo, descripcion, modulo, estado)
VALUES 
('Crear Usuarios', 'AUTH_USER_CREATE', 'Permite registrar nuevos usuarios', 'SEGURIDAD', 1),
('Editar Permisos', 'AUTH_PERM_EDIT', 'Permite modificar privilegios de otros', 'SEGURIDAD', 1),
('Ver Inventario', 'CAT_VIEW_STOCK', 'Permite ver el stock de sedes', 'CATALOGO', 1);

-- 5. INSERTAR USUARIO ADMINISTRADOR "SEMILLA"
INSERT INTO auth.usuarios (id_rol, id_sede, nombre_completo, email, password_hash, estado, fecha_creacion)
VALUES (
    (SELECT TOP 1 id_rol FROM auth.roles WHERE nombre = 'ADMIN'),
    (SELECT TOP 1 id_sede FROM auth.sedes WHERE nombre = 'SEDE CENTRAL - LIMA'),
    'Administrador Inicial',
    'admin@tiendasgo.com',
    '$2a$10$E77e4tvH1jdX1bBT8OevwOugs5JGgQ9ocfZDitHuiQp4hxRkk7qEq', -- Hash BCrypt de 'admin123'
    1,
    GETDATE()
);
GO

-- 6. ASIGNAR PERMISOS AL ROL ADMIN
INSERT INTO auth.permisos_rol (id_rol, id_permiso)
SELECT (SELECT id_rol FROM auth.roles WHERE nombre = 'ADMIN'), id_permiso 
FROM auth.permisos;
GO


