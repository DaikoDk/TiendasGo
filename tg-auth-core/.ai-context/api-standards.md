# Estándares de API - TiendasGo
Todas las respuestas del Controller deben seguir este formato JSON:

1. **Respuestas Exitosas (200, 201):**
   {
   "timestamp": "ISO-8601",
   "message": "Mensaje descriptivo",
   "data": { ... objeto o lista ... }
   }

2. **Respuestas de Error (400, 401, 404, 500):**
   {
   "timestamp": "ISO-8601",
   "error": "Nombre del Error",
   "message": "Explicación amigable",
   "path": "/api/v1/..."
   }

**Regla:** Usar CamelCase para las llaves del JSON (ej: "nombreUsuario", no "nombre_usuario").