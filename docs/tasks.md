# Tasks

## Change Requests en curso

| ID | Estado | Tarea | Descripcion | Archivos involucrados | Depende de | Criterio de done |
|----|--------|-------|-------------|------------------------|------------|------------------|
| TASK-001 | ✅ | Blindar el `limit` maximo en `taskService.getTasks` | Centralizar el maximo permitido y clamplear cualquier valor invalido. | `src/services/task.service.ts` | Ninguna | Ninguna request de tareas sale con `limit > 50`. |
| TASK-002 | ✅ | Reusar el limite compartido desde el calendario | Reemplazar el `100` hardcodeado por la constante del servicio. | `src/app/calendar/page.tsx` | TASK-001 | La carga del calendario no vuelve a disparar la validacion del backend. |
| TASK-003 | ⏳ | Revisar otros callers y cerrar verificacion funcional | Inspeccionar usos de `taskService.getTasks` y validar el flujo manualmente. | `src/app/tasks/page.tsx`, `src/components/CreateItemModal.tsx`, `docs/changes/CR-001-calendar-task-limit.md` | TASK-001, TASK-002 | No quedan callers conocidos fuera de contrato y el cambio queda listo para cierre documental. |
| TASK-004 | ✅ | Completar tarea desde el chat (ejecucion real) | Cuando el intent es 'complete', resolver la tarea por nombre con Gemini y llamar `updateTask({ is_completed: true })` via REST. | `src/app/api/ai/chat/route.ts` | Ninguna | El chat realmente completa la tarea en el backend y confirma al usuario con el nombre. |
| TASK-005 | ✅ | Eliminar tarea desde el chat (ejecucion real) | Cuando el intent es 'delete', resolver por nombre con Gemini y llamar DELETE via REST. | `src/app/api/ai/chat/route.ts` | TASK-004 | El chat elimina la tarea y confirma; sin ejecucion sin identificacion clara. |
| TASK-006 | ✅ | Actualizar tarea desde el chat (ejecucion real) | Cuando el intent es 'update', extraer campos con Gemini y llamar PATCH via REST. | `src/app/api/ai/chat/route.ts` | TASK-004 | El chat modifica la tarea correcta en el backend y confirma los campos cambiados. |
| TASK-007 | ✅ | Listar eventos desde el chat | Añadir intent 'list_events' con regex, llamar GET /events/ usando JWT del header, responder en markdown. | `src/app/api/ai/chat/route.ts` | Ninguna | El chat muestra los proximos eventos del usuario con titulo, fecha y hora. |
| TASK-008 | ✅ | Crear evento desde el chat | Añadir intent 'create_event', extraer datos con Gemini y llamar POST /events/. | `src/app/api/ai/chat/route.ts` | TASK-007 | El chat crea el evento en el backend y confirma titulo y fecha al usuario. |
| TASK-009 | ✅ | Listar notas desde el chat | Añadir intent 'list_notes' con regex, llamar GET /notes/ usando JWT del header. | `src/app/api/ai/chat/route.ts` | Ninguna | El chat muestra las notas del usuario con titulo y fecha de actualizacion. |
| TASK-010 | ✅ | Crear nota desde el chat | Añadir intent 'create_note', extraer titulo y contenido con Gemini y llamar POST /notes/. | `src/app/api/ai/chat/route.ts` | TASK-009 | El chat crea la nota en el backend y confirma al usuario. |