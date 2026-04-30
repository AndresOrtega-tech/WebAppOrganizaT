# CR-002 — Integración de tools disponibles en el chat IA

| Campo        | Valor                                |
|--------------|--------------------------------------|
| **ID**       | CR-002                               |
| **Tipo**     | MEDIUM                               |
| **Fecha**    | 2026-04-18                           |
| **Estado**   | ✅ Completado                        |
| **Autor**    | andrestamez5                         |

---

## Problema

El chat IA de OrganizaT (`/chat`) funciona con detección de intenciones por regex y solo tiene **dos tools realmente ejecutadas**: listar tareas y crear tareas. Las demás intenciones detectadas (completar, actualizar, eliminar) solo arman un prompt guiado para Gemini sin ejecutar ninguna acción real. Además, **eventos y notas no existen en el chat**.

En consecuencia:
- El usuario puede pedirle al chat que complete una tarea y el modelo le responde que va a hacerlo, pero nada cambia en el backend.
- El chat no puede mostrar ni crear eventos o notas a pesar de que los services existen.

---

## Objetivo

Conectar progresivamente todas las tools disponibles al chat IA, en este orden de prioridad:

1. **Tasks — completar** (`updateTask` con `is_completed: true`)
2. **Tasks — eliminar** (`deleteTask`)
3. **Tasks — actualizar** (`updateTask` con campos editados)
4. **Events — listar** (`eventsService.getEvents`)
5. **Events — crear** (`eventsService.createEvent`)
6. **Notes — listar** (`notesService.getNotes`)
7. **Notes — crear** (`notesService.createNote`)

---

## Inventario de tools disponibles

### Via MCP (`tasks-mcp.service.ts` → `https://mcp-organizt.onrender.com/mcp`)

| Tool MCP          | Método del service      | Estado en chat |
|-------------------|-------------------------|----------------|
| `list_tasks`      | `listTasks`             | ✅ Wired        |
| `create_task`     | `createTask`            | ✅ Wired        |
| `update_task`     | `updateTask`            | ⚠️ Intent sí, ejecución NO |
| `delete_task`     | `deleteTask`            | ⚠️ Intent sí, ejecución NO |
| `get_task`        | `getTask`               | ❌ No wired     |
| `get_task_related`| `getTaskRelated`        | ❌ No wired     |
| `assign_tag_to_task` | `assignTagToTask`    | ❌ No wired     |

### Via REST directo (`eventsService` / `notesService`)

| Operación              | Service                        | Estado en chat |
|------------------------|-------------------------------|----------------|
| Listar eventos         | `eventsService.getEvents`     | ❌ No wired     |
| Crear evento           | `eventsService.createEvent`   | ❌ No wired     |
| Listar notas           | `notesService.getNotes`       | ❌ No wired     |
| Crear nota             | `notesService.createNote`     | ❌ No wired     |

> **Nota de arquitectura**: eventos y notas no tienen MCP; se llaman directamente desde el route handler. El JWT del usuario se extrae del header `Authorization` igual que en las tasks.

---

## Decisión arquitectural: eliminación del MCP

Durante la implementación se decidió **eliminar por completo el MCP** (`tasks-mcp.service.ts` + `https://mcp-organizt.onrender.com/mcp`) y reemplazarlo por llamadas REST directas al backend propio.

**Razones:**
- MCP en Render tiene cold starts y latencia adicional innecesaria
- El backend REST ya tiene todos los endpoints necesarios
- El JWT del usuario se extrae del header `Authorization` en el edge route y se reenvía directamente
- Eliminó la dependencia de `localStorage` que impedía usar los services del frontend en edge

**Helper añadido:** `backendFetch<T>(path, jwt, options)` — wraps `fetch` + `BACKEND_URL` + auth header + JSON parsing.

---

## Estrategia de implementación

### Patrón actual (conservar)

El route `POST /api/ai/chat` usa un pipeline lineal:
1. Detectar intención con `getTaskIntent(text)` → regex
2. Si hay intención conocida → ejecutar tool → responder con texto plano o stream
3. Si no → Gemini conversacional con stream

Este patrón es simple y funciona bien. Se extiende, no se reemplaza.

### Extensiones a añadir

1. **Completar tarea**: cuando `intent === 'complete'`, usar Gemini para identificar la tarea por nombre desde la lista real, luego llamar `updateTask({ is_completed: true })` con el ID resuelto.
2. **Eliminar tarea**: cuando `intent === 'delete'`, pedir confirmación en el primer turno; en el segundo turno ejecutar `deleteTask`.
3. **Actualizar tarea**: cuando `intent === 'update'`, extraer campos con Gemini igual que en `extractTaskDataWithAI`, luego llamar `updateTask`.
4. **Intención de eventos**: añadir `getEventIntent(text)` con regex similar a `getTaskIntent`, conectar `list` y `create`.
5. **Intención de notas**: añadir `getNoteIntent(text)`, conectar `list` y `create`.

---

## Archivos involucrados

| Archivo | Cambio |
|---------|--------|
| `src/app/api/ai/chat/route.ts` | Añadir ejecución real en intents `complete`, `update`, `delete`; añadir bloques para events y notes |
| `src/services/mcp/tasks-mcp.service.ts` | Sin cambios (ya tiene `updateTask` y `deleteTask`) |

---

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Gemini identifica la tarea incorrecta al completar/eliminar | Siempre preguntar confirmación antes de ejecutar delete o complete si el título no es unívoco |
| Rate limiting en MCP (Render cold start) | Timeout catch ya existe en el route; se mantiene |
| `eventsService` y `notesService` requieren `fetchWithAuth` que usa `localStorage` | Estos services no corren en edge; moverlos a llamadas directas con JWT del header igual que MCP |

---

## Criterios de cierre

- [x] `complete` realmente llama `PATCH /tasks/{id}` con `is_completed: true` y confirma al usuario con el nombre de la tarea modificada.
- [x] `delete` identifica la tarea con Gemini y llama `DELETE /tasks/{id}`.
- [x] `update` extrae campos y llama `PATCH /tasks/{id}` con los datos modificados.
- [x] `list_events` retorna los próximos eventos del usuario en formato markdown.
- [x] `create_event` extrae título, fecha inicio/fin con Gemini y crea el evento.
- [x] `list_notes` retorna las notas del usuario.
- [x] `create_note` crea una nota con título y contenido extraído por Gemini.
- [x] Sin errores TypeScript en `route.ts`.
- [x] Sin regresión en `list_tasks` y `create_task` (las tools que ya funcionan).
- [x] MCP eliminado; toda la comunicación va por REST directo al backend.
