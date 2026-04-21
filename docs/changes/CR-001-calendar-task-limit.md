# CR-001: Respetar el limite de paginacion de tareas en calendario

> **Tipo:** SMALL
> **Fecha:** 2026-04-18
> **Estado:** En progreso

---

## Descripcion del cambio

El calendario estaba solicitando tareas con `limit=100`, pero el backend solo acepta valores menores o iguales a `50`. Este cambio corrige esa desalineacion y deja el limite maximo centralizado en el servicio de tareas.

## Motivacion

Evitar el error de consola que corta la carga del calendario y documentar el ajuste como un cambio incremental sobre una funcionalidad ya existente.

## Impacto estimado

### Documentos a actualizar

- [x] `docs/tasks.md` — seguimiento general del cambio
- [x] `openspec/changes/calendar-task-limit-clamp/proposal.md` — propuesta del cambio
- [x] `openspec/changes/calendar-task-limit-clamp/specs/task-pagination-limit/spec.md` — especificacion del comportamiento esperado
- [x] `openspec/changes/calendar-task-limit-clamp/design.md` — decisiones tecnicas
- [x] `openspec/changes/calendar-task-limit-clamp/tasks.md` — tareas del cambio y avance parcial

### Tasks nuevas a agregar en docs/tasks.md

- [x] **TASK-001** — Blindar el `limit` maximo en `taskService.getTasks`
  Descripcion: centralizar el maximo permitido y clamplear cualquier valor invalido.
  Archivos involucrados: `src/services/task.service.ts`
  Depende de: ninguna
  Criterio de done: ninguna request de tareas sale con `limit > 50`.

- [x] **TASK-002** — Reusar el limite compartido desde el calendario
  Descripcion: reemplazar el `100` hardcodeado por la constante del servicio.
  Archivos involucrados: `src/app/calendar/page.tsx`
  Depende de: TASK-001
  Criterio de done: la carga del calendario no vuelve a disparar la validacion del backend.

- [ ] **TASK-003** — Revisar otros callers y cerrar verificacion funcional
  Descripcion: inspeccionar usos de `taskService.getTasks` y validar el flujo manualmente.
  Archivos involucrados: `src/app/tasks/page.tsx`, `src/components/CreateItemModal.tsx`, `docs/tasks.md`
  Depende de: TASK-001, TASK-002
  Criterio de done: no quedan callers conocidos fuera de contrato y el cambio queda listo para cierre documental.

### Archivos de codigo afectados

- `src/services/task.service.ts` — agrega el clamp del parametro `limit`.
- `src/app/calendar/page.tsx` — usa el limite compartido al paginar tareas.

### Riesgos

- Puede existir otro caller con una expectativa implicita de recibir mas de 50 items por pagina.
- Sin tests automatizados, la validacion final depende de lint y prueba manual.

## Plan de ejecucion

Re-entrada al pipeline desde: spec + design + tasks, con implementacion ya iniciada.

Pasos:
1. Registrar el cambio en SDD y en `docs/changes`.
2. Aplicar y dejar marcado el fix de codigo.
3. Revisar callers relacionados y validar el flujo del calendario.
4. Cerrar verificacion y documentacion final.

## Criterio de done

El frontend deja de enviar limites invalidos al endpoint de tareas, el calendario vuelve a cargar correctamente y el cambio queda trazado tanto en el CR como en los artefactos SDD.