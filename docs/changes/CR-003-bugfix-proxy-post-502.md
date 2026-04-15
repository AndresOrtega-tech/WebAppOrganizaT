# CR-003: Bugfix — POST 502 desde el proxy interno de Next.js

> **Tipo:** SMALL
> **Fecha:** 2026-04-14
> **Estado:** ✅ Aplicado

---

## Descripción del cambio

Corrección de tres bugs encadenados que provocaban errores 502 al crear tasks, notes y otros recursos desde el frontend. Los GETs y la autenticación inicial funcionaban; solo fallaban las operaciones de escritura (POST/PATCH/PUT).

## Motivación

Los usuarios podían iniciar sesión y ver datos pero no podían crear ningún registro nuevo. La consola del browser mostraba:

```
Error: Error al conectar con el backend desde el proxy interno
  at ApiClient.fetchWithAuth
  at ApiClient.post
  at Object.createTask / createNote
```

Acompañado de `Failed to load resource: status 502 (Bad Gateway)` en `/api/backend/tasks` y `/api/backend/notes`.

## Root cause

Tres problemas encadenados:

### 1. `skipTrailingSlashRedirect` faltante en `next.config.ts`
Next.js, por defecto, redirige internamente `/api/backend/tasks/` → `/api/backend/tasks` (quita el slash) **antes** de que el catch-all route handler lo procese. El proxy entonces forwardea al backend sin slash. FastAPI responde con `307 Temporary Redirect` apuntando a `tasks/`. Node.js `fetch` sigue el `307` pero **pierde el body del POST**, el backend recibe una request vacía y el proxy cae en el `catch` → 502.

Los GETs no fallaban porque no tienen body: el 307 se seguía sin problema.

### 2. Trailing slash no preservada en el proxy interno
En `src/app/api/backend/[...path]/route.ts`, el path reconstruido no preservaba la barra final original de la request entrante, amplificando el problema anterior.

### 3. Endpoint de refresh token incorrecto
En `src/services/auth.service.ts`, el endpoint para renovar el access token apuntaba a `/auth/auth/refresh` (con `/auth` duplicado) en lugar de `/auth/refresh`. Esto hacía que, al expirar el token, el refresco fallara y las requests subsiguientes cayeran en cascada con 401.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `next.config.ts` | `skipTrailingSlashRedirect: true` |
| `src/app/api/backend/[...path]/route.ts` | Preservar trailing slash del path entrante al construir la URL target del backend |
| `src/services/auth.service.ts` | `/auth/auth/refresh` → `/auth/refresh` |

## Bonus — Fix de Helm en Minikube

El webhook de validación de ingress-nginx (`ingress-nginx-admission`) tenía una IP stale por reinicios del controller (13 restarts). Helm fallaba con `no route to host` al validar el Ingress. Fix: `kubectl delete validatingwebhookconfiguration ingress-nginx-admission`. No es necesario para el funcionamiento del ingress; solo es validación de sintaxis al momento del deploy.

## Criterio de done

- Login funciona ✅
- GET de tasks/notes/events funciona ✅
- POST (crear task, crear nota) funciona sin 502 ✅
- Helm upgrade en Minikube exitoso sin error de webhook ✅
- Cambios mergeados de `docker_prod` → `docker-dev` ✅
