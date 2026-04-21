# CR-003 — Fecha real y filtros estructurados en el chat IA

| Campo        | Valor                                                              |
|--------------|--------------------------------------------------------------------|
| **ID**       | CR-003                                                             |
| **Tipo**     | MEDIUM                                                             |
| **Fecha**    | 2026-04-20                                                         |
| **Estado**   | ✅ Completado                                                      |
| **Autor**    | andrestamez5                                                       |

---

## Problema

El chat IA ya ejecuta CRUD y relaciones reales, pero seguia teniendo dos huecos funcionales:

1. No existia una tool explicita para saber la fecha actual, por lo que preguntas como "que dia es hoy" o correcciones de contexto temporal podian depender de la memoria del modelo.
2. Los listados de tareas, eventos y notas no exponian los filtros reales del backend. El chat devolvia colecciones generales aunque el usuario pidiera prioridad, etiquetas, fechas, archivadas, orden o agenda de hoy.

Esto generaba inconsistencias conversacionales, sobre todo en follow-ups como "solo las de hoy" o "mostrame las altas con la etiqueta urgente".

---

## Objetivo

Hacer que el chat:

1. Responda la fecha actual desde una fuente real y consistente.
2. Tenga una tool de agenda de hoy para combinar tareas pendientes del dia y eventos programados.
3. Aplique filtros estructurados reales en los listados de tareas, eventos y notas.
4. Use el contexto conversacional reciente para que la IA pueda elegir la tool correcta en mensajes de seguimiento cortos.

---

## Alcance implementado

### Nuevas capacidades del router de tools

- `get_today` — devuelve fecha actual, formato legible e ISO.
- `list_today_overview` — combina tareas pendientes con fecha de hoy y eventos del dia.

### Filtros soportados en tareas

- `tab`: pendientes o completadas
- `priority`: baja, media, alta
- `tag_ids` resueltos desde nombres de etiqueta mencionados por el usuario
- `due_date`
- `start_date` / `end_date`
- `date_field`
- `sort_by`
- `order`
- `show_overdue`
- `limit`

### Filtros soportados en eventos

- `start_date`
- `end_date`
- filtrado por nombre de etiqueta en memoria cuando la coleccion trae tags

### Filtros soportados en notas

- `is_archived`
- `tag_ids` resueltos desde nombres de etiqueta
- `sort_by`
- `order`

---

## Decisiones tecnicas

1. La fecha actual se centralizo en un helper con zona horaria fija `America/Mexico_City` para evitar drift por UTC en edge.
2. El router de tools ahora recibe contexto conversacional reciente y no solo el ultimo mensaje del usuario.
3. Los filtros se extraen con prompts dedicados por entidad y se traducen a query params reales del backend.
4. Donde el backend no expone filtro directo por etiqueta en eventos, el route hace un filtro en memoria sobre la respuesta recibida.

---

## Archivos involucrados

| Archivo | Cambio |
|---------|--------|
| `src/app/api/ai/chat/route.ts` | Se agregaron tools de fecha y agenda de hoy, contexto conversacional en el router, helpers de fecha consistente y extraccion/aplicacion de filtros para tareas, eventos y notas |
| `docs/tasks.md` | Se registraron las tasks cerradas asociadas al cambio |
| `docs/changes/index.md` | Se agrego el CR-003 al indice |

---

## Riesgos y tradeoffs

| Riesgo | Mitigacion |
|--------|------------|
| El backend de eventos no expone todos los filtros deseables por query | Se aplico solo filtrado adicional en memoria para etiquetas, manteniendo el resto sobre capacidades reales |
| El routing de follow-ups cortos puede fallar si el contexto reciente es ambiguo | El router ahora recibe historial reciente, pero sigue devolviendo `null` si no detecta una accion clara |
| La zona horaria de servidor podia romper expresiones como "hoy" | Se fijo una zona horaria consistente en helpers y prompts |

---

## Criterios de cierre

- [x] El chat puede responder "que dia es hoy" con una tool explicita y fecha real.
- [x] El chat puede responder "que tengo hoy" con tareas pendientes del dia y eventos de hoy.
- [x] `list_tasks` aplica filtros reales de prioridad, etiquetas, fechas y orden.
- [x] `list_events` aplica filtros reales de fecha y filtrado por etiqueta cuando hay datos suficientes.
- [x] `list_notes` aplica filtros reales de archivado, etiquetas y orden.
- [x] La seleccion de tool considera contexto conversacional reciente.
- [x] Sin errores TypeScript en `src/app/api/ai/chat/route.ts`.