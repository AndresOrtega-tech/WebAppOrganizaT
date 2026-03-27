# Project Brief: WebAppOrganizaT

## Objetivo del proyecto

WebAppOrganizaT busca ayudar a las personas a organizar su vida en un solo lugar, centralizando tareas, notas y eventos con relaciones entre sí para reducir pérdidas de contexto y mantener todo visible. <!-- confirmado por Andres -->

## Problema que resuelve

El proyecto apunta a resolver la fragmentación de información personal y académica/laboral, donde las personas suelen gestionar pendientes, apuntes y agenda en herramientas separadas que no se relacionan entre sí. <!-- confirmado por Andres -->

## Usuario final

El usuario actual es principalmente el propio equipo del proyecto en un contexto personal y escolar, con intención futura de evolucionarlo hacia una oferta útil para usuarios generales del mercado. <!-- confirmado por Andres -->

## Tipo de proyecto

Aplicación full stack ligera con frontend en Next.js, backend REST externo y endpoints internos de apoyo para capacidades de IA. <!-- inferido del código -->

## Stack actual

- Next.js 16.1.6 con App Router <!-- inferido del código -->
- React 19.2.3 <!-- inferido del código -->
- TypeScript 5 <!-- inferido del código -->
- Tailwind CSS 4 <!-- inferido del código -->
- Framer Motion para animaciones <!-- inferido del código -->
- Lucide React para iconografía <!-- inferido del código -->
- Google GenAI con Gemini 2.5 Flash para resumen y reformulación <!-- inferido del código -->
- Backend REST externo configurable mediante variables `NEXT_PUBLIC_DEV_BACKEND_URL`, `NEXT_PUBLIC_BACKEND_URL` y `NEXT_PUBLIC_USE_DEV_API` <!-- inferido del código -->

## MVP real detectado

- Registro, login, refresco de token, recuperación y actualización de contraseña <!-- inferido del código -->
- Dashboard principal con vista resumida de tareas, notas y eventos <!-- inferido del código -->
- CRUD de tareas con prioridad, fecha de vencimiento, filtrado y detalle <!-- inferido del código -->
- CRUD de notas con archivado, resumen por IA y detalle <!-- inferido del código -->
- CRUD de eventos con fecha, horario, ubicación y detalle <!-- inferido del código -->
- Gestión de tags y asignación de tags a tareas, notas y eventos <!-- inferido del código -->
- Relaciones entre tareas, notas y eventos mediante endpoints de relations <!-- inferido del código -->
- Tema claro/oscuro y UI responsive <!-- inferido del código -->

## Estado actual

El proyecto se considera prototipo en esta versión. El MVP funcional ya existe, pero la prioridad actual del equipo es dejar preparada la parte de Docker, Helm y Kubernetes local con Minikube, además de conectar el backend desde otro repositorio dentro de un clúster local. <!-- confirmado por Andres -->

## Restricciones conocidas

- Este repositorio no contiene el backend ni los modelos/migraciones reales de persistencia. <!-- inferido del código -->
- No hay archivo `.env.example`, `vercel.json`, `Dockerfile`, `docker-compose.yml` ni `railway.toml` visibles en el repositorio actual. <!-- inferido del código -->
- La configuración de despliegue todavía no está materializada en este repo y aparece como trabajo pendiente. <!-- confirmado por Andres -->
- Hay campos presentes en contratos (`media_url`, `calendar_event_id`, `reminders_data`) cuyo alcance funcional no puede confirmarse desde la UI actual. <!-- TODO: verificar -->

## Contexto técnico y operativo

El frontend usa componentes cliente de forma predominante y consume un backend externo por HTTP mediante una capa de servicios en `src/services`. La autenticación se apoya en tokens persistidos en `localStorage` y un `ApiClient` con refresh automático. Además, el proyecto incorpora dos route handlers internos en `src/app/api/ai/*` para encapsular llamadas server-side a Gemini. <!-- inferido del código -->

La interfaz incluye una landing pública, áreas autenticadas para home, tareas, notas, eventos y perfil, además de modales reutilizables para creación y vinculación de entidades. <!-- inferido del código -->

## Riesgos iniciales detectados

- Dependencia fuerte de un backend externo no versionado en este repositorio <!-- inferido del código -->
- Manejo de sesión distribuido en múltiples páginas vía `localStorage` <!-- inferido del código -->
- Falta de artefactos de infraestructura para el objetivo actual de contenerización y despliegue local <!-- confirmado por Andres -->
- Sin documentación visible de variables de entorno requeridas <!-- inferido del código -->

## Siguiente paso

Pipeline inicializado retroactivamente — continuar con `change-request-workflow.md` para nuevas features o con `verifier-archiver-workflow.md` para validar el estado actual.