# Spec: WebAppOrganizaT

## Resumen funcional

WebAppOrganizaT es una aplicación centrada en productividad personal que articula tareas, notas y eventos como entidades relacionadas, con autenticación de usuarios, gestión de etiquetas e integración de IA para resumen y reformulación de texto. <!-- inferido del código -->

## Alcance funcional activo

- Frontend autenticado para gestión operativa diaria <!-- inferido del código -->
- Landing pública y flujo de acceso <!-- inferido del código -->
- Consumo de backend REST externo <!-- inferido del código -->
- Endpoints internos de IA para enriquecer contenido textual <!-- inferido del código -->
- Preparación pendiente de contenerización e integración con backend en clúster local <!-- confirmado por Andres -->

## User stories inferidas

- Como usuario quiero registrarme para crear mi cuenta en la plataforma. <!-- inferido del código -->
- Como usuario quiero iniciar sesión y mantener mi sesión activa mediante refresh token para seguir usando la app sin reingresar credenciales constantemente. <!-- inferido del código -->
- Como usuario quiero recuperar y actualizar mi contraseña si pierdo acceso. <!-- inferido del código -->
- Como usuario quiero ver un dashboard con tareas, notas recientes y eventos del día para tener una vista rápida de mi organización. <!-- inferido del código -->
- Como usuario quiero crear, editar, completar y eliminar tareas para gestionar pendientes. <!-- inferido del código -->
- Como usuario quiero asignar prioridad, fechas y etiquetas a mis tareas para clasificarlas mejor. <!-- inferido del código -->
- Como usuario quiero crear, editar, archivar y eliminar notas para almacenar información importante. <!-- inferido del código -->
- Como usuario quiero generar un resumen automático de una nota para obtener una versión breve de su contenido. <!-- inferido del código -->
- Como usuario quiero crear, editar y eliminar eventos con fecha, hora, ubicación y modalidad de día completo. <!-- inferido del código -->
- Como usuario quiero relacionar tareas, notas y eventos para no perder el contexto entre mis elementos de trabajo. <!-- inferido del código -->
- Como usuario quiero crear y administrar etiquetas para filtrar mejor mis contenidos. <!-- inferido del código -->
- Como usuario quiero reformular descripciones de tareas, notas o eventos usando IA para mejorar claridad del texto. <!-- inferido del código -->
- Como equipo del proyecto quiero preparar Docker, Helm y Kubernetes local para integrar este frontend con el backend en otro repositorio. <!-- confirmado por Andres -->

## Entidades y modelos observados

### Usuario

- `email: string`
- `full_name: string`
- `avatar: string`

Fuente: `src/services/auth.service.ts`. <!-- inferido del código -->

### Task

- `id: string`
- `title: string`
- `description: string`
- `due_date: string | null`
- `is_completed: boolean`
- `priority: 'baja' | 'media' | 'alta'`
- `reminders_data: ReminderData[]`
- `has_reminder: boolean`
- `user_id: string`
- `calendar_event_id: string`
- `media_url: string | null`
- `created_at: string`
- `updated_at: string`
- `tags: Tag[]`
- `notes: Note[]`

Fuente: `src/services/task.service.ts`. <!-- inferido del código -->

### Note

- `id: string`
- `title: string`
- `content: string`
- `summary: string | null`
- `is_archived: boolean`
- `user_id: string`
- `media_url: string | null`
- `created_at: string`
- `updated_at: string`
- `tags?: Tag[]`
- `tasks?: Task[]`
- `events?: { id, title, start_time }[]`

Fuente: `src/services/notes.service.ts`. <!-- inferido del código -->

### Event

- `id: string`
- `title: string`
- `description: string | null`
- `start_time: string`
- `end_time: string`
- `location: string | null`
- `is_all_day: boolean`
- `user_id: string`
- `created_at: string`
- `updated_at: string`
- `reminders_data: ReminderData[]`
- `has_reminder: boolean`
- `tags?: Tag[]`
- `tasks?: Task[]`
- `notes?: Note[]`

Fuente: `src/services/events.service.ts`. <!-- inferido del código -->

### Tag

- `id: string`
- `name: string`
- `color: string`
- `icon: string | null`
- `user_id: string`
- `created_at: string`

Fuente: `src/services/tags.service.ts`. <!-- inferido del código -->

### ReminderData

- `id: string`
- `remind_at: string`
- `status: string`

Fuente: `src/services/task.service.ts` y `src/services/events.service.ts`. <!-- inferido del código -->

## Relaciones funcionales

- Una tarea puede tener múltiples tags. <!-- inferido del código -->
- Una nota puede tener múltiples tags. <!-- inferido del código -->
- Un evento puede tener múltiples tags. <!-- inferido del código -->
- Una tarea puede vincularse con una o varias notas. <!-- inferido del código -->
- Un evento puede vincularse con tareas. <!-- inferido del código -->
- Un evento puede vincularse con notas. <!-- inferido del código -->
- Las relaciones se manejan mediante endpoints dedicados bajo `/relations/*`. <!-- inferido del código -->

## Endpoints internos del repo

### `POST /api/ai/summarize`

Entrada:

```json
{
  "text": "contenido de la nota"
}
```

Salida exitosa:

```json
{
  "summary": "resumen en español"
}
```

Reglas observadas:

- Requiere `text` no vacío. <!-- inferido del código -->
- Requiere `GEMINI_API_KEY` en entorno del servidor. <!-- inferido del código -->
- Intenta generar un resumen de menos de 300 caracteres. <!-- inferido del código -->
- Si excede el límite tras varios intentos, recorta el texto como fallback. <!-- inferido del código -->

### `POST /api/ai/reformulate`

Entrada:

```json
{
  "text": "texto a reformular",
  "type": "task | note | event"
}
```

Salida exitosa:

```json
{
  "reformulatedText": "texto reformulado en español"
}
```

Reglas observadas:

- Requiere `text` no vacío. <!-- inferido del código -->
- Requiere `GEMINI_API_KEY`. <!-- inferido del código -->
- Usa límites por tipo: tarea 500, evento 500, nota 800 caracteres. <!-- inferido del código -->
- Si excede el límite tras varios intentos, recorta el resultado. <!-- inferido del código -->

## Endpoints externos consumidos

### Auth y usuario

- `POST /users` para registro <!-- inferido del código -->
- `POST /auth/login` para autenticación <!-- inferido del código -->
- `POST /auth/refresh` para refresh token <!-- inferido del código -->
- `POST /users/password/reset` para solicitar recuperación <!-- inferido del código -->
- `PATCH /users/password` para actualizar contraseña con token <!-- inferido del código -->
- `PATCH /users/avatar` para actualizar avatar <!-- inferido del código -->

### Tareas

- `GET /tasks/` con filtros y paginación <!-- inferido del código -->
- `GET /tasks/{id}` detalle <!-- inferido del código -->
- `POST /tasks/` creación <!-- inferido del código -->
- `PATCH /tasks/{id}` edición <!-- inferido del código -->
- `DELETE /tasks/{id}` eliminación <!-- inferido del código -->
- `POST /tasks/{id}/tags` asignación de tag <!-- inferido del código -->
- `DELETE /tasks/{id}/tags/{tagId}` remoción de tag <!-- inferido del código -->
- `GET /tasks/{id}/related` relaciones <!-- inferido del código -->

### Notas

- `GET /notes/` listado filtrable <!-- inferido del código -->
- `GET /notes/{id}` detalle <!-- inferido del código -->
- `POST /notes/` creación <!-- inferido del código -->
- `PATCH /notes/{id}` edición <!-- inferido del código -->
- `DELETE /notes/{id}` eliminación <!-- inferido del código -->
- `PATCH /notes/{id}/summary` persistencia de resumen IA <!-- inferido del código -->
- `POST /notes/{id}/tags` asignación de tag <!-- inferido del código -->
- `DELETE /notes/{id}/tags/{tagId}` remoción de tag <!-- inferido del código -->
- `GET /notes/{id}/related` relaciones <!-- inferido del código -->

### Eventos

- `GET /events/` listado con filtro por rango de fechas <!-- inferido del código -->
- `GET /events/{id}` detalle <!-- inferido del código -->
- `GET /events/{id}/related` relaciones <!-- inferido del código -->
- `POST /events/` creación <!-- inferido del código -->
- `PATCH /events/{id}` edición <!-- inferido del código -->
- `DELETE /events/{id}` eliminación <!-- inferido del código -->
- `POST /events/{id}/tags` asignación de tag <!-- inferido del código -->
- `DELETE /events/{id}/tags/{tagId}` remoción de tag <!-- inferido del código -->

### Relaciones

- `POST /relations/task-note` vincula tarea con nota <!-- inferido del código -->
- `DELETE /relations/task-note` desvincula tarea con nota <!-- inferido del código -->
- `POST /relations/task-event` vincula tarea con evento <!-- inferido del código -->
- `DELETE /relations/task-event` desvincula tarea con evento <!-- inferido del código -->
- `POST /relations/note-event` vincula nota con evento <!-- inferido del código -->
- `DELETE /relations/note-event` desvincula nota con evento <!-- inferido del código -->

### Tags

- `GET /tags/` listado <!-- inferido del código -->
- `POST /tags/` creación <!-- inferido del código -->
- `PATCH /tags/{id}` edición <!-- inferido del código -->
- `DELETE /tags/{id}` eliminación <!-- inferido del código -->

## Reglas de negocio observadas

- El frontend mantiene `access_token`, `refresh_token` y `user` en `localStorage`. <!-- inferido del código -->
- Cuando una petición autenticada responde `401`, el cliente intenta refrescar el token y reintenta la petición original. <!-- inferido del código -->
- La vista home delega al backend la priorización/orden de tareas usando `view=home` y `limit=50`. <!-- inferido del código -->
- La vista de eventos del día aplica un fallback client-side para compensar desajustes de zona horaria del backend. <!-- inferido del código -->
- Las notas pueden archivarse y consultarse por filtro de archivado. <!-- inferido del código -->
- La relación de tags a tareas y notas se ejecuta de forma iterativa; en eventos se usa `Promise.all`. <!-- inferido del código -->
- Los errores del backend se convierten a mensajes legibles mediante parseo de `detail` o `message`. <!-- inferido del código -->

## Ambigüedades detectadas

- No puede verificarse desde este repositorio si existe persistencia real de archivos para `media_url`. <!-- TODO: verificar -->
- No puede verificarse si hay UI completa para creación y edición de recordatorios. <!-- TODO: verificar -->
- No puede verificarse si `calendar_event_id` se usa para integración con un calendario externo. <!-- TODO: verificar -->
- El flujo exacto de confirmación post-registro no queda completamente demostrado solo con este repo frontend. <!-- TODO: verificar -->

## Funcionalidad pendiente declarada por el equipo

- Contenerización del frontend con Docker. <!-- confirmado por Andres -->
- Orquestación local con Helm y Kubernetes sobre Minikube. <!-- confirmado por Andres -->
- Integración del frontend con el backend desde otro repositorio dentro de un clúster local. <!-- confirmado por Andres -->