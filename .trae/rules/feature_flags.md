# Sistema de Feature Flags

Controlamos la disponibilidad de funcionalidades mediante "Feature Flags" definidas en `src/config/features.ts`.

## Configuración (`src/config/features.ts`)
```typescript
export const FEATURE_FLAGS = {
  // Tasks
  ENABLE_TASK_DETAIL: boolean,    // Detalle completo
  ENABLE_TASK_CREATION: boolean,  // Crear tareas
  ENABLE_TASK_EDIT: boolean,      // Editar tareas
  ENABLE_TASK_DELETION: boolean,  // Eliminar tareas
  ENABLE_TASK_FILTERS: boolean,   // Filtros
  ENABLE_TASK_TAGS: boolean,      // Etiquetas en tareas
  ENABLE_TASK_CONTEXT_MENU: boolean, // Menú contextual
  ENABLE_TASK_NOTE_LINKING: boolean, // Vincular notas
  ENABLE_AI_REFORMULATION: boolean, // IA en tareas

  // Tags
  ENABLE_TAGS_VIEW: boolean,     // Ver tags
  ENABLE_TAG_CREATION: boolean,  // Crear tags
  ENABLE_TAG_EDIT: boolean,      // Editar tags
  ENABLE_TAG_DELETION: boolean,  // Eliminar tags

  // Notes
  ENABLE_NOTES_VIEW: boolean,    // Ver notas
  ENABLE_NOTE_CREATION: boolean, // Crear notas
  ENABLE_NOTE_DETAIL: boolean,   // Detalle nota
  ENABLE_NOTE_EDIT: boolean,     // Editar nota
  ENABLE_NOTE_DELETION: boolean, // Eliminar nota
  ENABLE_NOTE_FILTERS: boolean,  // Filtros notas
  ENABLE_NOTE_AI_REFORMULATION: boolean, // IA en notas

  // Events
  ENABLE_EVENTS_VIEW: boolean,   // Ver eventos
  ENABLE_EVENT_CREATION: boolean, // Crear eventos
  ENABLE_EVENT_DETAIL: boolean,  // Detalle evento
  ENABLE_EVENT_EDIT: boolean,    // Editar evento
  ENABLE_EVENT_DELETION: boolean, // Eliminar evento
  ENABLE_EVENT_LINKING: boolean, // Vincular eventos
  ENABLE_EVENT_FILTERS: boolean, // Filtros eventos
  ENABLE_EVENT_AI_REFORMULATION: boolean, // IA en eventos

  // Auth & UI
  ENABLE_REGISTRATION: boolean,  // Registro
  ENABLE_USER_PROFILE: boolean,  // Perfil
  ENABLE_DARK_MODE: boolean,     // Modo oscuro
};
```

## Implementación
Usar la función `isFeatureEnabled` para renderizar condicionalmente componentes o lógica.

### Ejemplo:
```tsx
import { isFeatureEnabled } from '@/config/features';

{isFeatureEnabled('ENABLE_TASK_CREATION') && (
  <CreateButton />
)}
```

### Reglas
- **Siempre** envolver botones de acción destructiva o nueva funcionalidad.
- **Validar** tanto en UI (ocultar botón) como en lógica si es posible.
