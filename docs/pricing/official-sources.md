# Official pricing sources

- Uruguay UAM/MGAP: HTML/Excel/PDF segun publicacion. El adaptador prioriza CSV/HTML estructurado y usa PDF solo como fallback con `pdf-parse`.
- Chile ODEPA: portal de datos abiertos ODEPA/CKAN/CSV. Configurar `ODEPA_FEED_URL` al recurso CSV publicado.
- Colombia SIPSA: DANE expone servicio SOAP/WSDL. Configurar `SIPSA_WSDL_URL` y `SIPSA_SOAP_METHOD`.
- Mexico PROFECO QQP: datos abiertos en CSV por periodo. Configurar `PROFECO_QQP_FEED_URL`.

Frecuencias:

- UAM/MGAP: lunes y jueves despues de publicacion.
- ODEPA mayorista: diario habil.
- ODEPA consumidor: semanal.
- SIPSA: diario/semanal posterior a 14:00 local.
- PROFECO: mensual o al detectar nuevo recurso.
