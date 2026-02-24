# Arquitectura y Diseño

Estructura general y guías de estilo del proyecto.

## Diseño Visual (UI/UX)
- **Framework:** Tailwind CSS.
- **Modo Oscuro:** Soporte nativo mediante clase `dark` y `ThemeToggle`.
- **Paleta de Colores:**
  - Primario: `indigo-600` (acciones principales, links).
  - Fondos Light: `bg-gray-50` (páginas), `bg-white` (tarjetas).
  - Fondos Dark: `dark:bg-gray-950` (páginas), `dark:bg-gray-900` (tarjetas).
  - Texto: `text-gray-900`/`dark:text-white` (títulos), `text-gray-500`/`dark:text-gray-400` (subtítulos).
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
  - `/forgot-password`: Recuperación de contraseña.
- **Protegidas:**
  - `/home`: Dashboard principal de tareas.
  - `/tasks/[id]`: Detalle de tarea.
  - `/notes`: Dashboard principal de notas.
  - `/notes/[id]`: Detalle de nota.
  - `/profile`: Perfil de usuario.

## Flujo de Datos
1. **Frontend:** Next.js (App Router).
2. **Estado:** React Hooks (`useState`, `useEffect`) y Custom Hooks.
3. **API:** Servicios centralizados en `src/services/` (ej. `task.service.ts`, `notes.service.ts`).
