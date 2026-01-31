---
alwaysApply: false
description: Cambios en los estándares de desarrollo. cambios grandes en codigo, componentes, hooks, etc.
---
# Estándares de Desarrollo

Guía para mantener la calidad y consistencia del código.

## Separación de Responsabilidades (SoC)
Evitar "God Components". Dividir lógica y vista.

### 1. Custom Hooks (`src/hooks/`)
- Toda la lógica de estado (`useState`, `useEffect`), llamadas a API y handlers debe ir aquí.
- **Ejemplo:** `useTaskDetail.ts` maneja la carga, edición y borrado de tareas.

### 2. Componentes UI (`src/components/`)
- Componentes "tontos" (presentacionales) que reciben props.
- Deben ser reutilizables y pequeños.
- Agrupar por funcionalidad si son específicos (ej. `src/components/TaskDetail/`).

### 3. Páginas (`src/app/`)
- Actúan como "Controladores".
- Llaman al hook para obtener datos.
- Renderizan los componentes UI pasando los datos.
- Manejan el routing (`useRouter`) y Feature Flags globales.

## Convenciones
- **Archivos:** `PascalCase` para componentes, `camelCase` para hooks/utils.
- **Imports:** Usar alias `@/` para rutas absolutas.
- **Iconos:** Usar `lucide-react`.
