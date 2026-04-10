# Reglas de Seguridad JWT
1. **Librería:** Usar `jjwt` (io.jsonwebtoken).
2. **Expiración:** 24 horas.
3. **Claims:** El token debe incluir: `sub` (email), `role` (nombre del rol), `sedeId` e `idUsuario`.
4. **Header:** El token se envía y recibe en el encabezado `Authorization: Bearer <token>`.
5. **CORS:** Permitir solo `http://localhost:4200`.