# Skill Registry

## Project Context

- Stack principal: Next.js 16 App Router, React 19, TypeScript, Tailwind 4.
- Patrón de integración: frontend web con servicios en `src/services/*` y backend REST externo.
- Convenciones activas: nombres en inglés, comentarios en español solo cuando aportan contexto, evitar abstracciones innecesarias.

## Compact Rules

### General

- Mantener cambios chicos y orientados a la causa raíz.
- No ejecutar builds como parte del flujo normal de cambios.
- Antes de editar, leer el archivo completo y respetar su estilo existente.

### Next.js

- Respetar App Router y separar lógica de fetch en servicios reutilizables.
- Evitar lógica de contrato HTTP dispersa en páginas o componentes.
- Centralizar límites, validaciones y mapeos de API en `src/services/*`.

### Documentation

- Documentar cambios incrementales en `docs/changes/`.
- Mantener tareas activas también en `docs/tasks.md`.
- Para cambios guiados por SDD, usar `openspec/changes/<change-name>/`.

## User Skills

| Skill | Trigger | Uso esperado |
|-------|---------|--------------|
| `change_request` | Cambios sobre funcionalidades existentes | Crear CR y reingresar al pipeline |
| `next-best-practices` | Cambios en App Router, route handlers o data fetching | Validar convenciones de Next.js |
| `frontend-design` | Nuevas pantallas o rediseños | Mantener calidad visual y dirección clara |
| `frontend-responsive-design-standards` | Ajustes responsive | Mantener layout mobile-first |
| `go-testing` | Tests en Go | Aplicar patrones de testing del stack Go |

## Project-Level Conventions

- No se detectaron archivos propios de convenciones dentro del repo al momento de inicializar SDD.
- La referencia documental disponible está en `README.md` y en las instrucciones globales del entorno.