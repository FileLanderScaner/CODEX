# Gap analysis

## Cerrado en esta iteracion

- API versionada `/api/v1` con health, readiness, catalogo, precios, favoritos, alertas, reportes, billing, admin e import interno.
- Configuracion validada con zod y separacion de secretos server-only.
- Migracion Supabase versionada con trazabilidad raw payload -> observacion -> current price.
- Adaptadores oficiales iniciales para UAM/MGAP, ODEPA, SIPSA y PROFECO.
- CORS allowlist exacta, headers seguros, rate limiting y request_id.
- Tests automatizados base y fixtures realistas.
- CI/CD GitHub Actions y artefactos alternativos AWS/GCP/Azure/Netlify.

## Pendiente operativo

- Conectar recursos oficiales definitivos de ODEPA/PROFECO por periodo en variables de entorno.
- Validar metodo SOAP exacto de SIPSA contra el WSDL productivo.
- Configurar claims `app_metadata.role` para admin, moderator, merchant_admin e internal_job.
- Ejecutar migraciones en Supabase y revisar policies contra datos reales.
- Crear productos/categorias base de catalogo con datos curados.
