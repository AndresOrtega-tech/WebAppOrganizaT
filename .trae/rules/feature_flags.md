---
alwaysApply: true
---
# Sistema de Feature Flags

Controlamos la disponibilidad de funcionalidades mediante "Feature Flags" definidas en `src/config/features.ts`.

## Configuración (`src/config/features.ts`)
```typescript
export const FEATURE_FLAGS = {
  // Tasks
  ENABLE_TASK_CREATION: boolean, // Botón "+" en Home
  ENABLE_TASK_EDITING: boolean,  // Botón "Lápiz" en Detalle
  ENABLE_TASK_DELETION: boolean, // Botón "Basura" en Detalle/Card
  ENABLE_TASK_DETAIL: boolean,   // Click en Card -> Detalle
  ENABLE_TASK_FILTERS: boolean,  // Barra de filtros en Home
  ENABLE_AI_REFORMULATION: boolean, // Reformular descripción con IA

  // Tags
  ENABLE_TAGS_VIEW: boolean,     // Sidebar de etiquetas
  ENABLE_TAG_EDIT: boolean,      // Edición de etiquetas (doble click/menú)
  ENABLE_TAG_DELETION: boolean,  // Eliminación de etiquetas

  // Notes
  ENABLE_NOTES_VIEW: boolean,    // Dashboard de notas
  ENABLE_NOTE_CREATION: boolean, // Crear nuevas notas
  ENABLE_NOTE_DETAIL: boolean,   // Ver detalle
  ENABLE_NOTE_EDITING: boolean,  // Editar notas
  ENABLE_NOTE_DELETION: boolean, // Eliminar notas
  ENABLE_NOTE_FILTERS: boolean,  // Filtrado de notas
  ENABLE_NOTE_AI_REFORMULATION: boolean, // Reformular contenido con IA

  // Auth
  ENABLE_REGISTRATION: boolean,  // Acceso a registro de usuarios
  ENABLE_USER_PROFILE: boolean,  // Acceso a perfil de usuario
};
```

## Implementación
Usar la función `isFeatureEnabled` para renderizar condicionalmente componentes o lógica.

### Ejemplo (React Component):
```tsx
import { isFeatureEnabled } from '@/config/features';

{isFeatureEnabled('ENABLE_TASK_CREATION') && (
  <CreateButton />
)}
```

### Reglas
- **Siempre** envolver botones de acción destructiva o nueva funcionalidad.
- **Validar** tanto en UI (ocultar botón) como en lógica si es posible (aunque el backend es la verdad final).
- Ajustar los valores `true`/`false` en cada rama según la especificación de `architecture.md`.
