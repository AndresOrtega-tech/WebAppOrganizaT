# CR-002: CI con GitHub Actions — Lint + Docker Build

> **Tipo:** SMALL
> **Fecha:** 2026-03-27
> **Estado:** ✅ Aplicado

---

## Descripción del cambio
Pipeline de CI en GitHub Actions que ejecuta lint, next build y docker build para validar que el código compila y la imagen Docker se construye.

## Motivación
No existía CI. Los cambios llegaban sin verificación automática.

## Impacto

### Archivos creados
- `.github/workflows/ci.yml` — workflow con dos jobs: `lint-and-build` y `docker-build`

### Trigger
- Push a `docker_prod`
- PR hacia `docker_prod`

### Pipeline
1. `lint-and-build`: checkout → node 20 → npm ci → lint → next build
2. `docker-build` (depende de 1): checkout → docker build

## Tasks
- [x] **TASK-004** — Crear `.github/workflows/ci.yml`

## Criterio de done
Push a `docker_prod` → workflow verde (lint + build + docker build pasan).
