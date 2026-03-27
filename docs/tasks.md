# Task Board: WebAppOrganizaT

> **Basado en:** init-pipeline (proyecto existente)
> **Total de tasks:** 12 completadas + 8 pendientes

---

## ✅ Features ya implementadas
> Estas features existen en el código. No hay que implementarlas.

- [x] **IMPL-001** — Landing pública de producto
  - **Estado:** implementado
  - **Archivos principales:** `src/app/page.tsx`, `src/components/Home/AnimatedShowcase.tsx`
  - **Notas:** Usa una propuesta visual más elaborada que el resto de la app; falta documentar SEO y despliegue.

- [x] **IMPL-002** — Registro, login y manejo básico de sesión
  - **Estado:** implementado
  - **Archivos principales:** `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/services/auth.service.ts`, `src/services/api.client.ts`
  - **Notas:** La sesión depende de `localStorage` y refresh token.

- [x] **IMPL-003** — Recuperación y actualización de contraseña
  - **Estado:** implementado
  - **Archivos principales:** `src/app/forgot-password/page.tsx`, `src/app/update-password/page.tsx`, `src/services/auth.service.ts`
  - **Notas:** El comportamiento exacto del flujo backend no puede validarse desde este repo.

- [x] **IMPL-004** — Dashboard principal con resumen operativo
  - **Estado:** implementado
  - **Archivos principales:** `src/app/home/page.tsx`, `src/components/Home/HomeSidebar.tsx`, `src/components/Home/HomeHeader.tsx`
  - **Notas:** Combina tareas, notas recientes y eventos del día.

- [x] **IMPL-005** — CRUD de tareas con filtros y detalle
  - **Estado:** implementado
  - **Archivos principales:** `src/app/tasks/page.tsx`, `src/app/tasks/[id]/page.tsx`, `src/services/task.service.ts`
  - **Notas:** Incluye prioridad, completado, fechas, relaciones y paginación.

- [x] **IMPL-006** — CRUD de notas con archivado y detalle
  - **Estado:** implementado
  - **Archivos principales:** `src/app/notes/page.tsx`, `src/app/notes/[id]/page.tsx`, `src/services/notes.service.ts`
  - **Notas:** Incluye archivado y resumen persistido.

- [x] **IMPL-007** — CRUD de eventos con filtros por fecha y detalle
  - **Estado:** implementado
  - **Archivos principales:** `src/app/events/page.tsx`, `src/app/events/[id]/page.tsx`, `src/services/events.service.ts`
  - **Notas:** Incluye modalidad de día completo y ubicación.

- [x] **IMPL-008** — Gestión de tags transversal
  - **Estado:** implementado
  - **Archivos principales:** `src/services/tags.service.ts`, `src/components/TagModal.tsx`, `src/components/TagsSidebar.tsx`
  - **Notas:** Las tags se reutilizan entre tareas, notas y eventos.

- [x] **IMPL-009** — Relaciones entre tareas, notas y eventos
  - **Estado:** implementado
  - **Archivos principales:** `src/components/LinkedItemsList.tsx`, `src/components/LinkItemModal.tsx`, `src/services/task.service.ts`, `src/services/events.service.ts`, `src/services/notes.service.ts`
  - **Notas:** La visibilidad total del flujo en todas las pantallas debe verificarse.

- [x] **IMPL-010** — Integración de IA para resumen de notas
  - **Estado:** implementado
  - **Archivos principales:** `src/app/api/ai/summarize/route.ts`, `src/hooks/useAiSummary.ts`
  - **Notas:** Depende de `GEMINI_API_KEY`; no hay controles operativos avanzados.

- [x] **IMPL-011** — Integración de IA para reformulación de texto
  - **Estado:** implementado
  - **Archivos principales:** `src/app/api/ai/reformulate/route.ts`, `src/hooks/useAiReformulation.ts`, `src/components/AiReformulateButton.tsx`
  - **Notas:** Soporta tareas, notas y eventos con límites por tipo.

- [x] **IMPL-012** — Tema claro/oscuro y persistencia visual
  - **Estado:** implementado
  - **Archivos principales:** `src/providers/ThemeProvider.tsx`, `src/components/ThemeToggle.tsx`, `src/app/globals.css`
  - **Notas:** Existe mezcla entre fuentes configuradas y fuente final aplicada en `body`.

---

## 📋 Tasks pendientes
> Lo que falta implementar, corregir o mejorar según el análisis.

- [ ] **TASK-001** — Agregar Docker para el frontend
  - **Descripción:** Crear artefactos de contenerización del frontend para ejecutar la app en un entorno reproducible.
  - **Archivos involucrados:** `Dockerfile`, `.dockerignore`, `README.md` <!-- TODO: verificar -->
  - **Depende de:** ninguna
  - **Criterio de done:** La app puede construirse y levantarse en contenedor con variables de entorno documentadas.

- [ ] **TASK-002** — Definir despliegue local con Helm/Minikube
  - **Descripción:** Crear chart o manifiestos para desplegar el frontend en Kubernetes local y dejar lista la integración con el backend externo al repo.
  - **Archivos involucrados:** `helm/` o `k8s/` <!-- TODO: verificar -->
  - **Depende de:** TASK-001
  - **Criterio de done:** Existe despliegue reproducible en Minikube con configuración parametrizable.

- [ ] **TASK-003** — Documentar variables de entorno y setup operativo
  - **Descripción:** Añadir documentación mínima de variables requeridas para frontend, backend URL y Gemini.
  - **Archivos involucrados:** `.env.example`, `README.md`
  - **Depende de:** ninguna
  - **Criterio de done:** Un colaborador puede ejecutar la app sin descubrir variables por inspección del código.

- [ ] **TASK-004** — Validar alcance real de reminders, media y calendario
  - **Descripción:** Confirmar si estos campos son funcionalidad activa, deuda pendiente o contratos heredados del backend.
  - **Archivos involucrados:** `src/services/task.service.ts`, `src/services/events.service.ts`, `src/services/notes.service.ts`, componentes de formularios
  - **Depende de:** ninguna
  - **Criterio de done:** La documentación distingue claramente entre features activas, descartadas y futuras.

- [ ] **TASK-005** — Unificar manejo de sesión y estado de usuario
  - **Descripción:** Reducir duplicación de lecturas de `localStorage` y consolidar lógica de sesión en una capa reutilizable.
  - **Archivos involucrados:** `src/services/api.client.ts`, páginas de `src/app/**`, `src/providers/` <!-- TODO: verificar -->
  - **Depende de:** ninguna
  - **Criterio de done:** La sesión no depende de lógica repetida en cada pantalla.

- [ ] **TASK-006** — Añadir validación de formularios en cliente
  - **Descripción:** Incorporar validación consistente para formularios de auth, tareas, notas, eventos y tags.
  - **Archivos involucrados:** páginas y modales de `src/app/**` y `src/components/**`
  - **Depende de:** ninguna
  - **Criterio de done:** Los inputs inválidos se detectan antes de enviar requests al backend.

- [ ] **TASK-007** — Revisar y documentar flujo de confirmación de registro
  - **Descripción:** Verificar si `register/confirmation` representa un flujo funcional completo o solo una pantalla auxiliar.
  - **Archivos involucrados:** `src/app/register/page.tsx`, `src/app/register/confirmation/page.tsx`, backend asociado <!-- TODO: verificar -->
  - **Depende de:** ninguna
  - **Criterio de done:** El flujo de alta de usuario queda documentado y probado de punta a punta.

- [ ] **TASK-008** — Incorporar pruebas automatizadas mínimas
  - **Descripción:** Definir una base de testing para servicios críticos, hooks de IA y flujos principales de pantalla.
  - **Archivos involucrados:** configuración de testing y suites nuevas <!-- TODO: verificar -->
  - **Depende de:** ninguna
  - **Criterio de done:** Existe al menos cobertura inicial para auth, `ApiClient` y servicios principales.

---

## Orden de ejecución sugerido

1. TASK-003
2. TASK-001
3. TASK-002
4. TASK-004
5. TASK-007
6. TASK-005
7. TASK-006
8. TASK-008