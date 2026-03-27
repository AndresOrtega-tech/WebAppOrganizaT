# CR-001: Frontend con Docker, Helm y Minikube

> **Tipo:** MEDIUM
> **Fecha:** 2026-03-26
> **Estado:** Aprobado

---

## Descripción del cambio

Se registrará el cambio necesario para contenerizar el frontend de WebAppOrganizaT y dejarlo listo para desplegarse localmente con Helm sobre Minikube, integrándose con el backend que ya está configurado y operativo en el clúster local. El alcance incluye `Dockerfile`, `.dockerignore`, chart Helm del frontend, ingress y script de setup para Minikube. <!-- confirmado por Andres -->

## Motivación

Este cambio responde a un requisito académico y además permite tener trazabilidad formal de la parte de infraestructura que falta para completar el entorno local del proyecto. <!-- confirmado por Andres -->

## Impacto estimado

La clasificación es `MEDIUM` porque el cambio introduce una capacidad operativa nueva, cruza varios artefactos de infraestructura y modifica la forma de ejecutar e integrar el frontend, pero no redefine el stack de negocio ni altera la arquitectura funcional del producto.

### Documentos a actualizar
- [ ] `docs/spec.md` — sección de funcionalidad pendiente e infraestructura operativa
- [ ] `docs/design.md` — sección de arquitectura operativa y despliegue local
- [ ] `docs/blueprint.md` — nota de cambio y riesgos operativos asociados

### Tasks nuevas a agregar en docs/tasks.md

No se agregan tasks nuevas en este CR porque el trabajo ya está registrado en el backlog actual. Este cambio reutiliza explícitamente las siguientes tasks existentes:

- [ ] **TASK-001** — Agregar Docker para el frontend
  - Descripción: Crear artefactos de contenerización del frontend para ejecutar la app en un entorno reproducible.
  - Archivos involucrados: `Dockerfile`, `.dockerignore`, `README.md`
  - Depende de: ninguna
  - Criterio de done: La app puede construirse y levantarse en contenedor con variables de entorno documentadas.

- [ ] **TASK-002** — Definir despliegue local con Helm/Minikube
  - Descripción: Crear chart o manifiestos para desplegar el frontend en Kubernetes local y dejar lista la integración con el backend externo al repo.
  - Archivos involucrados: `helm/organizat-frontend/Chart.yaml`, `helm/organizat-frontend/values.yaml`, `helm/organizat-frontend/values-dev.yaml`, `helm/organizat-frontend/templates/deployment.yaml`, `helm/organizat-frontend/templates/service.yaml`, `helm/organizat-frontend/templates/ingress.yaml`, `helm/organizat-frontend/templates/_helpers.tpl`, `helm/organizat-frontend/templates/NOTES.txt`
  - Depende de: TASK-001
  - Criterio de done: Existe despliegue reproducible en Minikube con configuración parametrizable.

- [ ] **TASK-003** — Documentar variables de entorno y setup operativo
  - Descripción: Añadir documentación mínima de variables requeridas para frontend, backend URL y Gemini.
  - Archivos involucrados: `.env.example`, `README.md`, `scripts/minikube-setup.sh`
  - Depende de: ninguna
  - Criterio de done: Un colaborador puede ejecutar la app sin descubrir variables por inspección del código.

### Archivos de código afectados
- `Dockerfile` — imagen del frontend para build y ejecución
- `.dockerignore` — exclusiones de contexto de build
- `helm/organizat-frontend/Chart.yaml` — metadatos del chart
- `helm/organizat-frontend/values.yaml` — configuración base del despliegue
- `helm/organizat-frontend/values-dev.yaml` — configuración de entorno local
- `helm/organizat-frontend/templates/deployment.yaml` — deployment del frontend
- `helm/organizat-frontend/templates/service.yaml` — service interno
- `helm/organizat-frontend/templates/ingress.yaml` — exposición HTTP del frontend
- `helm/organizat-frontend/templates/_helpers.tpl` — helpers del chart
- `helm/organizat-frontend/templates/NOTES.txt` — instrucciones post-deploy
- `scripts/minikube-setup.sh` — automatización del entorno local
- `README.md` — guía de ejecución y despliegue local
- `.env.example` — variables necesarias del frontend

### Riesgos
- Desalineación entre variables del frontend y el backend ya desplegado en Minikube.
- Configuración incorrecta del ingress o del túnel local, especialmente si el acceso al backend depende de `kubectl port-forward`.
- Diferencias entre entorno local y futura ejecución académica/demo si no queda claramente documentado el flujo.
- Posible duplicidad documental si el CR no reutiliza correctamente las tasks ya existentes.

## Plan de ejecución

Re-entrada al pipeline desde: `Workflow 2 parcial`

Pasos:
1. Actualizar docs afectados cuando se vaya a implementar el cambio.
2. Reutilizar `TASK-001`, `TASK-002` y `TASK-003` como fuente de verdad en `docs/tasks.md`.
3. [GATE] Mantener aprobación explícita antes de tocar código o infraestructura.
4. Ejecutar implementación del frontend con Docker, Helm y Minikube.
5. Verifier → Archiver.

## Criterio de done

El cambio estará completo cuando el frontend pueda construirse en contenedor, desplegarse en Minikube mediante Helm, consumir correctamente el backend ya operativo en el clúster local o vía túnel/port-forward documentado, y el equipo pueda reproducir el entorno completo siguiendo la documentación del repositorio.

## Recomendación posterior

Después de implementar este CR, correr `update-docs` para mantener consistentes `docs/tasks.md`, `spec.md`, `blueprint.md` y la documentación auxiliar del proyecto.