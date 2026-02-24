# Plan: Integrar nuevo backend de tareas en el frontend

## Objetivo
Alinear el frontend (home, tasks, detalle de tarea) con el nuevo contrato de la API de tareas descrito en `.trae/rules/tasks/rules.md`, incluyendo vistas `home`/`tasks`, tabs `pending`/`completed`, filtros, paginación por cursor y manejo de `reminders`.

## Alcance (supuesto)
- Usar los endpoints:
  - `POST /api/tasks/` para crear tareas con `reminders`.
  - `GET /api/tasks/` con `view` y filtros para home y listado de tareas.
  - `GET /api/tasks/{id}` para detalle.
  - `GET /api/tasks/{id}/related` y `POST /api/tasks/{id}/tags` para relaciones.
- Actualizar únicamente el frontend de Next.js en este repo (sin tocar backend).

## Pasos

1. **Sincronizar servicio de tareas (`task.service.ts`)**
   - Revisar implementación actual.
   - Ajustar/añadir métodos:
     - `createTask(payload)` que envíe `reminders` según el contrato.
     - `getTasks(params)` que acepte `{ view, tab, tag_ids, priority, end_date, limit, cursor }` y devuelva `{ data, next_cursor, has_more }`.
     - `getTaskById(id)` acorde al nuevo response.
     - `getTaskRelated(id)` para `/tasks/{id}/related`.
     - `assignTagToTask(id, tagId)` para `POST /tasks/{id}/tags`.

2. **Integrar vista `home` con `view=home`**
   - Revisar página `/home` y cómo carga tareas actualmente.
   - Reemplazar la lógica de carga para usar `getTasks({ view: 'home', ... })`.
   - Eliminar cualquier ordenamiento manual en frontend que contradiga las reglas de `view=home`.
   - Asegurar que la UI usa los campos devueltos por la API (ej. `due_date`, `is_completed`).

3. **Integrar vista `/tasks` con `view=tasks`**
   - Revisar página `/tasks` (nueva `src/app/tasks/page.tsx`).
   - Conectar tabs `pending`/`completed` con query `tab`.
   - Mapear filtros de la UI a query params (`tag_ids`, `priority`, `end_date`).
   - Implementar paginación basada en `cursor` (`next_cursor` / `has_more`), si la UX lo requiere (lista paginada o “cargar más”).

4. **Detalle de tarea y relaciones**
   - Revisar `useTaskDetail` y `TaskDetail`:
     - Confirmar que `getTaskById` usa el nuevo contrato (especialmente `reminders_data`, `has_reminder`).
     - Añadir uso de `getTaskRelated(id)` para obtener `tags`, `notes`, `events` si aún no se usa.
     - Alinear la lógica de asignar etiquetas a `POST /tasks/{id}/tags` (o reutilizar helpers existentes).

5. **Creación/edición de tareas y `reminders`**
   - Revisar formularios de creación/edición (modales relacionados a tareas).
   - Asegurar que el payload de creación/actualización envía `reminders` siguiendo el formato `{ unit, value }`.
   - Validar que el frontend interpreta `reminders_data` correctamente al mostrar avisos o al mapear de vuelta a `reminders` para edición.

6. **Verificación y pruebas manuales**
   - Probar:
     - Crear tarea con `due_date` y `reminders`.
     - Ver la tarea en `view=home` y `view=tasks` en diferentes combinaciones de filtros.
     - Cambiar tab `pending`/`completed` y verificar que las reglas de orden se respetan (al menos a nivel de contrato, asumiendo orden ya dado por backend).
     - Asignar etiquetas a una tarea y verificar en el detalle y en `/tasks`.
   - Revisar consola y manejar cualquier error 4xx/5xx evidente.

## Notas
- No se tocará el backend desde este plan; se asume que cumple las reglas del documento de tasks.
- Antes de modificar archivos existentes del frontend, se leerán completos y se pedirá confirmación según las reglas del proyecto.

