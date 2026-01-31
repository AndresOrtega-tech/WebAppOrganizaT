# WebAppOrganizaT

Una aplicación moderna para la gestión de tareas personales, construida con Next.js y diseñada para la productividad.

## 🚀 Características Principales

- **Gestión de Tareas:** Crear, editar, eliminar y marcar tareas como completadas.
- **Etiquetas (Tags):** Organiza tus tareas con etiquetas personalizables (colores, nombres).
- **Filtros Avanzados:** Filtra tareas por estado (pendientes/completadas), etiquetas y ordenamiento.
- **Interfaz Moderna:** UI limpia y responsive construida con Tailwind CSS.
- **Feature Flags:** Sistema robusto para activar/desactivar funcionalidades experimentalmente.

## 🛠 Tech Stack

- **Framework:** [Next.js 14+](https://nextjs.org) (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React
- **Estado/Lógica:** React Hooks + Custom Hooks

## 📂 Documentación y Reglas

Para mantener la calidad y consistencia del código, consulta nuestra documentación interna en `.trae/rules/`:

- **[Arquitectura](.trae/rules/architecture.md):** Estructura del proyecto, rutas y diseño visual.
- **[Desarrollo](.trae/rules/development.md):** Estándares de código, uso de hooks y componentes.
- **[Feature Flags](.trae/rules/feature_flags.md):** Guía de configuración y uso de flags (`src/config/features.ts`).

## 🚦 Getting Started

1. **Instalar dependencias:**

```bash
npm install
# or
yarn install
```

2. **Configurar entorno:**
   Crea un archivo `.env.local` con las variables necesarias (consulta con el equipo o revisa `.env.example` si existe).

3. **Correr el servidor de desarrollo:**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🤝 Contribución

Por favor, revisa las guías de desarrollo antes de enviar un Pull Request. Asegúrate de que tu código cumpla con las reglas definidas en `.trae/rules/development.md`.
