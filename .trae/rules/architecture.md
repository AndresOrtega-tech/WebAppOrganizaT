# Arquitectura y Diseño

Estructura general y guías de estilo del proyecto.

## Diseño Visual (UI/UX)
- **Framework:** Tailwind CSS.
- **Paleta de Colores:**
  - Primario: `indigo-600` (acciones principales, links).
  - Fondos: `bg-gray-50` (páginas), `bg-white` (tarjetas/contenedores).
  - Texto: `text-gray-900` (títulos), `text-gray-500` (subtítulos/meta).
  - Estados: `green-500` (completado), `red-600` (eliminar/error).
- **Tipografía:** Sans-serif por defecto (`font-sans`).
- **Bordes:** Redondeados suaves (`rounded-2xl`, `rounded-3xl`).

## Estructura de Componentes
- **Modales:** Fondo con `backdrop-blur-sm`, centrados, animaciones suaves.
- **Tarjetas:** Sombra suave (`shadow-sm`), hover effect (`hover:shadow-md`).
- **Botones:** `rounded-full` o `rounded-xl`, con estados hover y active (`active:scale-95`).

## Estructura de Rutas y Flujo
- **Públicas:**
  - `/` (Landing Page): Presentación y entrada.
  - `/login`: Inicio de sesión.
  - `/register`: Creación de cuenta (Feature Flag).
- **Protegidas:**
  - `/home`: Dashboard principal de tareas.
  - `/tasks/[id]`: Detalle de tarea.

## Flujo de Datos
1. **Frontend:** Next.js (App Router).
2. **Estado:** React Hooks (`useState`, `useEffect`) y Custom Hooks.
3. **API:** Servicios centralizados en `src/services/` (ej. `task.service.ts`).
