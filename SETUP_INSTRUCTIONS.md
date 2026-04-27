# AhorroYA MVP - test en menos de 1 hora

## Objetivo

Validar si usuarios en Uruguay/LatAm entienden y usan una app para encontrar el supermercado mas barato por producto.

## Como correr

```powershell
cd C:\codex
npm.cmd install
npm.cmd run web
```

URL local habitual:

```text
http://127.0.0.1:8081
```

## Que probar con usuarios

1. Pedirles que busquen `leche`.
2. Ver si entienden cual es el precio mas barato.
3. Pedirles que compartan el resultado.
4. Pedirles que guarden un favorito.
5. Pedirles que carguen un precio nuevo.
6. Ver si entienden puntos/ranking/badge.
7. Pedirles que creen una alerta.
8. Pedirles que reporten un precio incorrecto.
9. Preguntar si pagarian por alertas de precio.

## Hipotesis de growth

- El boton compartir convierte cada ahorro encontrado en una pieza viral.
- El texto compartido debe ser concreto: producto + precio + tienda + ahorro.
- Los productos mas virales probablemente sean leche, carne, arroz, yerba y aceite.
- Los puntos aumentan carga de precios y convierten usuarios en colaboradores.
- Historial y favoritos aumentan retorno porque reducen friccion.

## Hipotesis de monetizacion

- Ads: viable si hay frecuencia de uso alta.
- Premium: viable si las alertas de precio generan ahorro recurrente.
- Afiliados/comisiones: viable si supermercados aceptan trafico medible.
- Interstitial: probar cada 3 a 5 busquedas sin dañar retencion.

## Siguiente sprint recomendado

1. Agregar ubicacion por barrio.
2. Agregar mas mock data por zona.
3. Medir busquedas y shares.
4. Crear landing/waitlist.
5. Escalar el backend real en Supabase cuando haya senales de uso.
6. Moderar precios cargados por usuarios.
7. Convertir ranking local en ranking real por ciudad.

## Funcionalidad actual lista para prueba

- Busqueda y comparacion por producto.
- Filtro por barrio.
- Carga comunitaria de precios.
- Historial, favoritos y alertas simuladas.
- Reportes de precio incorrecto.
- Share viral y WhatsApp.
- Ads simulados y Premium simulado.
- Datos estructurados para crecer sobre Supabase sin perder fallback local.
