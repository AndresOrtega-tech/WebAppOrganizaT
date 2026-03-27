# Design: WebAppOrganizaT

## Arquitectura observada

El sistema sigue una arquitectura de frontend desacoplado que consume un backend REST externo y reserva al mismo repositorio solo dos route handlers internos para operaciones de IA. La mayor parte de la lógica de interfaz se implementa con Client Components en Next.js y una capa explícita de servicios para acceso HTTP. <!-- inferido del código -->

## Vista de alto nivel

### Capa de presentación

- `src/app/page.tsx` presenta la landing pública. <!-- inferido del código -->
- `src/app/home/page.tsx` funciona como dashboard autenticado. <!-- inferido del código -->
- `src/app/tasks`, `src/app/notes`, `src/app/events` y sus detalles encapsulan los módulos operativos principales. <!-- inferido del código -->
- `src/app/login`, `src/app/register`, `src/app/forgot-password`, `src/app/update-password` y `src/app/profile` cubren autenticación y cuenta. <!-- inferido del código -->

### Capa de componentes

- Componentes generales para modales, tarjetas, filtros y badges en `src/components`. <!-- inferido del código -->
- Submódulos por dominio para Home, TaskDetail, NoteDetail y EventDetail. <!-- inferido del código -->
- Componentes reutilizables de relación entre entidades como `LinkedItemsList` y `LinkItemModal`. <!-- inferido del código -->

### Capa de hooks

- Hooks de IA: `useAiSummary` y `useAiReformulation`. <!-- inferido del código -->
- Hooks de detalle: `useTaskDetail`, `useNoteDetail`, `useEventDetail`. <!-- inferido del código -->

### Capa de servicios

- `auth.service.ts` define URLs base y contratos de autenticación. <!-- inferido del código -->
- `api.client.ts` centraliza fetch autenticado, refresh token y helpers HTTP. <!-- inferido del código -->
- `task.service.ts`, `notes.service.ts`, `events.service.ts`, `tags.service.ts` y `user.service.ts` encapsulan acceso por dominio. <!-- inferido del código -->

### Capa server-side propia

- `src/app/api/ai/summarize/route.ts` ejecuta resúmenes con Gemini. <!-- inferido del código -->
- `src/app/api/ai/reformulate/route.ts` reformula texto con Gemini. <!-- inferido del código -->

## Flujos relevantes

### Flujo de autenticación

1. El usuario se registra o inicia sesión desde páginas dedicadas. <!-- inferido del código -->
2. La respuesta de login guarda tokens y datos de usuario en `localStorage`. <!-- inferido del código -->
3. Las páginas autenticadas leen `user` desde `localStorage`. <!-- inferido del código -->
4. `ApiClient` añade token bearer y, ante `401`, intenta refresh automático. <!-- inferido del código -->
5. Si el refresh falla, se limpia sesión y se redirige a `/login`. <!-- inferido del código -->

### Flujo de dashboard

1. `HomePage` carga tareas priorizadas, tags, notas recientes y eventos del día. <!-- inferido del código -->
2. Los datos se resuelven mediante llamadas a servicios por dominio. <!-- inferido del código -->
3. El usuario puede abrir un modal unificado para crear tarea, nota, evento o tag. <!-- inferido del código -->

### Flujo de IA para notas

1. El usuario solicita resumen de una nota. <!-- inferido del código -->
2. `useAiSummary` llama `POST /api/ai/summarize`. <!-- inferido del código -->
3. Si la respuesta trae `summary`, el frontend la persiste con `PATCH /notes/{id}/summary`. <!-- inferido del código -->

### Flujo de reformulación

1. El usuario solicita mejorar un texto de tarea, nota o evento. <!-- inferido del código -->
2. `useAiReformulation` llama `POST /api/ai/reformulate` con el tipo de entidad. <!-- inferido del código -->
3. El texto reformulado se reinyecta en el formulario o estado del componente llamador. <!-- inferido del código -->

### Flujo de relaciones

1. Desde los detalles o modales de vínculo, el usuario selecciona una entidad relacionada. <!-- inferido del código -->
2. El frontend consume endpoints `/relations/*` o relaciones específicas por entidad. <!-- inferido del código -->
3. La UI refresca relaciones para mantener trazabilidad contextual entre tareas, notas y eventos. <!-- inferido del código -->

## Módulos principales

### Home

- Sidebar con navegación y tags
- Header con acciones rápidas
- Lista de tareas, notas recientes y eventos del día

### Tasks

- Listado filtrable
- Tarjetas con estado y prioridad
- Vista de detalle
- Modales de edición y tags

### Notes

- Listado de notas activas/archivadas
- Vista de detalle
- Soporte de resumen IA y relaciones

### Events

- Listado por fechas
- Vista de detalle
- Gestión de vínculos con tareas y notas

### Profile

- Gestión de avatar
- Cambio de contraseña
- Logout

## Diseño visual observado

### Tipografía

- `layout.tsx` carga `Geist` y `Geist_Mono` con `next/font/google`. <!-- inferido del código -->
- `globals.css` expone variables `--font-geist-sans` y `--font-geist-mono`, aunque el `body` todavía usa `Arial, Helvetica, sans-serif`. <!-- inferido del código -->

### Tokens visibles

- `--background` y `--foreground` definen colores base de tema. <!-- inferido del código -->
- Existe un custom variant `dark` para Tailwind. <!-- inferido del código -->
- La landing usa una dirección visual con gradientes índigo y violeta, bordes suaves y superficies con blur. <!-- inferido del código -->
- Las vistas autenticadas usan una paleta más sobria basada en grises con soporte dark mode. <!-- inferido del código -->

### Sistema de tema

- `ThemeProvider` usa `useSyncExternalStore` para sincronizar estado de tema con `localStorage`. <!-- inferido del código -->
- Si no existe preferencia guardada, usa `prefers-color-scheme`. <!-- inferido del código -->

### Responsive

- Sidebar colapsable con persistencia local de apertura. <!-- inferido del código -->
- Layout principal con grid adaptativo y breakpoints Tailwind. <!-- inferido del código -->
- La landing y pantallas internas contemplan comportamiento móvil y escritorio. <!-- inferido del código -->

## Decisiones arquitectónicas visibles

- El frontend no usa un store global; la coordinación se resuelve con hooks y estado local. <!-- inferido del código -->
- La lógica HTTP está concentrada en servicios y no dispersa directamente en todos los componentes. <!-- inferido del código -->
- El backend de negocio está externalizado, mientras que la IA se mantiene local al frontend para proteger la API key de Gemini del lado del servidor. <!-- inferido del código -->

## Deuda técnica y huecos de diseño

- Repetición de lógica de `sidebar_open` en múltiples páginas. <!-- inferido del código -->
- Ausencia de validación de formularios basada en esquema en cliente. <!-- inferido del código -->
- No hay evidencia de una estrategia documentada de estados de error o loading unificada. <!-- inferido del código -->
- No puede confirmarse el diseño de flujos para archivos, recordatorios o sincronización con calendario. <!-- TODO: verificar -->
- No hay artefactos de diseño/infraestructura para Docker, Helm o Kubernetes aunque son la prioridad inmediata. <!-- confirmado por Andres -->

## Consideraciones de infraestructura inmediata

El diseño operativo del proyecto debe extenderse para ejecutar el frontend en contenedor, definir chart o manifiestos de Helm/Kubernetes y coordinar la conexión con el backend en otro repositorio dentro de Minikube. Eso no forma parte del código actual, pero sí del siguiente tramo de trabajo confirmado por el equipo. <!-- confirmado por Andres -->