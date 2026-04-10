# Manifiesto de Arquitectura N-Capas - TiendasGo

Este documento define la estructura estricta y las reglas de diseño para el microservicio `tg-auth-core`. Copilot debe seguir esta jerarquía y reglas en cada sugerencia de código.

## 1. Estructura de Paquetes (Árbol de Directorios)

```text
src/main/java/com/tiendasgo/auth/
├── config/                # Seguridad, JWT, CORS, Beans de configuración.
├── controllers/           # Endpoints REST. Reciben DTOs y llaman a Services.
├── domain/                # Capa de Dominio (Núcleo del negocio).
│   ├── entity/            # Entidades JPA mapeadas al esquema 'auth'.
│   └── repository/        # Interfaces JpaRepository.
├── services/              # Lógica de negocio.
│   ├── IAuthService.java  # Interfaces (Contratos).
│   └── impl/              # Implementaciones (Lógica real).
├── dto/                   # Data Transfer Objects.
│   ├── request/           # Inputs desde el Frontend.
│   └── response/          # Outputs hacia el Frontend.
├── exceptions/            # GlobalExceptionHandler y excepciones personalizadas.
└── utils/                 # Constantes, Mappers y Utilidades.