# Estrategia de Errores
1. No usar try-catch en los Controllers.
2. Si un recurso no existe, lanzar `EntityNotFoundException`.
3. Si las credenciales fallan, lanzar `BadCredentialsException`.
4. Todos los errores deben ser capturados por `GlobalExceptionHandler` en el paquete `exceptions`.