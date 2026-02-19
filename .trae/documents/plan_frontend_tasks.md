# Plan de acción — Frontend tareas (Bloques 1–4)

## Alcance
Implementar los 4 bloques del plan en el frontend: view param, infinite scroll con cursor, optimistic updates blindados y rediseño UI del detalle.

## Bloque 1 — Param `view`
1. Identificar los puntos donde se llama a `fetchTasks` en Home y Tasks.
2. Agregar `view: 'home'` y `view: 'tasks'` según corresponda.
3. Remover filtros de fecha/estado en frontend que entren en conflicto con el backend para esas vistas.

## Bloque 2 — Cursor pagination + infinite scroll
1. Definir estado: `tasks`, `nextCursor`, `hasMore`, `isLoadingMore`.
2. Implementar `loadMore` con cursor y append.
3. Agregar `IntersectionObserver` con sentinel al final de la lista.
4. Persistir estado de lista y cursor al volver del detalle usando store global.
5. Asegurar que no se recargue al montar si hay estado previo.

## Bloque 3 — Optimistic updates en detalle de tarea
1. Revisar flujos de vincular/desvincular notas y eventos.
2. Agregar snapshot + rollback en caso de error.
3. Forzar sync con `GET /api/tasks/{id}/related` al fallar.
4. Confirmar éxito con refetch ligero tras operaciones exitosas.

## Bloque 4 — Rediseño UI detalle de tarea
1. Ajustar layout a 2 columnas (>=1024px) y 1 columna móvil.
2. Eliminar bordes innecesarios en card principal y secciones vinculadas.
3. Mantener separadores sutiles y fondo diferenciado de descripción.
4. Mantener badges de fecha/prioridad y sidebar.

## Validación
1. Verificar que la lista en Home/Tasks muestre datos del backend sin filtros locales.
2. Confirmar scroll infinito y preservación de estado al volver del detalle.
3. Probar vincular/desvincular con errores simulados y rollback correcto.
4. Verificar UI en dark/light y responsivo.
