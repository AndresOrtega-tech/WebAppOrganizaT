---
alwaysApply: false
description: Cambios en el sistema de Feature Flags.
---
# Sistema de Feature Flags

Controlamos la disponibilidad de funcionalidades mediante "Feature Flags" definidas en `src/config/features.ts`.

## Configuración (`src/config/features.ts`)
```typescript
export const FEATURE_FLAGS = {
  ENABLE_TASK_CREATION: boolean, // Botón "+" en Home
  ENABLE_TASK_EDITING: boolean,  // Botón "Lápiz" en Detalle
  ENABLE_TASK_DELETION: boolean, // Botón "Basura" en Detalle/Card
  ENABLE_TASK_DETAIL: boolean,   // Click en Card -> Detalle
  ENABLE_REGISTRATION: boolean,  // Acceso a registro de usuarios
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
