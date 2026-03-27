# Blueprint: WebAppOrganizaT

## Visión integrada del proyecto

WebAppOrganizaT es un sistema de organización personal con ambición de mercado que ya implementa un núcleo funcional de productividad basado en tres entidades principales: tareas, notas y eventos. Estas entidades no viven aisladas; el frontend prioriza su relación bidireccional para que el usuario mantenga contexto entre pendientes, apuntes y agenda. <!-- inferido del código -->

Desde el punto de vista técnico, el proyecto actual es principalmente un frontend Next.js con App Router que depende de un backend REST externo para la lógica de negocio y persistencia. A nivel local, este repositorio también contiene dos endpoints internos orientados a IA generativa con Gemini, usados para resumir notas y reformular contenido textual. <!-- inferido del código -->

El equipo considera que el MVP funcional ya está resuelto y que la prioridad de esta fase es la preparación de infraestructura con Docker, Helm y Kubernetes local mediante Minikube, así como la conexión con el backend alojado en otro repositorio. <!-- confirmado por Andres -->

## Síntesis funcional

- Autenticación completa de usuario con refresh token <!-- inferido del código -->
- Dashboard con vista condensada del trabajo diario <!-- inferido del código -->
- CRUD de tareas, notas y eventos <!-- inferido del código -->
- Gestión de etiquetas transversales <!-- inferido del código -->
- Relaciones entre entidades mediante endpoints dedicados <!-- inferido del código -->
- IA aplicada a contenido textual <!-- inferido del código -->

## Síntesis de diseño

- Frontend intensivamente client-side con servicios tipados por dominio <!-- inferido del código -->
- `ApiClient` central como adaptador de transporte y sesión <!-- inferido del código -->
- UI modular por dominio con componentes reutilizables y modales compartidos <!-- inferido del código -->
- Sistema visual con dark mode, tokens básicos y mezcla de landing más expresiva con área autenticada más sobria <!-- inferido del código -->

## Riesgos identificados en el escaneo

### Riesgos de arquitectura

- El repositorio depende de un backend externo que no puede auditarse desde aquí, por lo que contratos y comportamiento real pueden divergir. <!-- inferido del código -->
- La sesión del usuario se administra con `localStorage` y lógica distribuida en distintas páginas; eso complica consistencia y testabilidad. <!-- inferido del código -->
- La app recae mayormente en Client Components, con menor aprovechamiento de capacidades server-first de Next.js. <!-- inferido del código -->

### Riesgos de producto

- Parte de los contratos sugiere features no plenamente visibles en UI, como recordatorios, `media_url` o calendario. <!-- TODO: verificar -->
- El flujo de confirmación de registro y la cobertura total de relaciones visibles desde todas las pantallas no queda completamente confirmado. <!-- TODO: verificar -->

### Riesgos operativos

- No existen artefactos de infraestructura dentro del repo para el objetivo actual de Docker, Helm y Minikube. <!-- confirmado por Andres -->
- No hay `.env.example` ni documentación visible de variables requeridas, lo que incrementa fricción de setup. <!-- inferido del código -->
- La integración con Gemini no muestra rate limiting, quota guardrails ni configuración operativa documentada. <!-- inferido del código -->

### Riesgos de calidad

- No se observan tests automatizados en la estructura actual. <!-- inferido del código -->
- Hay tipados flexibles y algunos usos de `any`. <!-- inferido del código -->
- El manejo de errores es funcional pero heterogéneo entre servicios, hooks y páginas. <!-- inferido del código -->

## Ambigüedades sin resolver

- No puede verificarse desde este repositorio si existe persistencia real de archivos para `media_url`. <!-- TODO: verificar -->
- No puede verificarse si hay UI completa para creación y edición de recordatorios. <!-- TODO: verificar -->
- No puede verificarse si `calendar_event_id` se usa para integración con un calendario externo. <!-- TODO: verificar -->
- El flujo exacto de confirmación post-registro no queda completamente demostrado solo con este repo frontend. <!-- TODO: verificar -->
- No puede verificarse el despliegue actual real de esta rama ni la topología esperada final más allá de Docker, Helm y Minikube como meta inmediata. <!-- TODO: verificar -->

## Dirección recomendada inmediata

1. Documentar y materializar infraestructura de contenedorización del frontend.
2. Definir cómo se parametrizará la conexión al backend dentro del clúster local.
3. Añadir documentación de entorno y operación para que el proyecto sea reproducible por el equipo.
4. Revisar features ambiguas para separar claramente lo implementado de lo solo modelado en contratos.

## Lectura estratégica

El proyecto ya tiene una base funcional suficiente para demostración y uso controlado, pero su siguiente cuello de botella no está en nuevas pantallas sino en convertir el sistema en un entorno ejecutable, integrable y demostrable de forma estable en infraestructura local. <!-- confirmado por Andres -->