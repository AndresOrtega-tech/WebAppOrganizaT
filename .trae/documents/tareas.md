# Plan de Trabajo — Frontend · organizaT
**Fecha:** Febrero 2026

---

## Resumen

| # | Cambio | Prioridad |
|---|--------|-----------|
| 1 | Consumo del param `view` en Vista Inicio y Vista Tareas | Alta |
| 2 | Infinite scroll con cursor pagination | Alta |
| 3 | Verificar y blindar optimistic updates en detalle de tarea | Media |
| 4 | Rediseño UI del detalle de tarea | Media |

> Este plan depende del plan de backend. Implementar después de que los endpoints estén listos.

---

## Bloque 1 — Consumo del param `view`

### Qué cambia
Las llamadas a `GET /api/tasks/` en Vista Inicio y Vista Tareas deben pasar el param `view` correspondiente.

```ts
// Vista Inicio
fetchTasks({ view: 'home' })

// Vista Tareas
fetchTasks({ view: 'tasks' })
```

### Consideraciones
- Eliminar cualquier filtrado de fechas o estado que se esté haciendo en el **frontend** — esa lógica ahora vive en el backend
- Verificar que el componente de lista en ambas vistas no asuma que recibirá siempre el mismo shape de datos

---

## Bloque 2 — Infinite scroll con cursor pagination

### Qué cambia
Dejar de cargar todas las tareas de un jalón. El estado de la lista ahora maneja un cursor para solicitar el siguiente batch.

### Estado necesario por vista

```ts
const [tasks, setTasks] = useState([])
const [nextCursor, setNextCursor] = useState<string | null>(null)
const [hasMore, setHasMore] = useState(true)
const [isLoadingMore, setIsLoadingMore] = useState(false)
```

### Lógica de carga

```ts
const loadMore = async () => {
  if (!hasMore || isLoadingMore) return
  setIsLoadingMore(true)

  const res = await fetchTasks({ view: 'tasks', cursor: nextCursor })

  setTasks(prev => [...prev, ...res.data])   // append, no replace
  setNextCursor(res.next_cursor)
  setHasMore(res.has_more)
  setIsLoadingMore(false)
}
```

### Trigger del scroll

Usar `IntersectionObserver` sobre un elemento sentinel al final de la lista:

```ts
const sentinelRef = useRef(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) loadMore() },
    { threshold: 0.1 }
  )
  if (sentinelRef.current) observer.observe(sentinelRef.current)
  return () => observer.disconnect()
}, [nextCursor, hasMore])

// En el JSX, al final de la lista:
<div ref={sentinelRef} />
{isLoadingMore && <TaskSkeleton />}
```

### Preservar scroll position al navegar al detalle y regresar
Al ir de `/tasks` → `/tasks/123` → regresar, la lista no debe recargarse desde cero.

Solución: guardar el estado de tareas y cursor en un store global (Zustand o Context), no en estado local del componente.

```ts
// En el store
tasks: Task[]
nextCursor: string | null
hasMore: boolean

// Al montar la vista de tareas
if (store.tasks.length > 0) return  // ya hay datos, no recargar
loadInitial()
```

---

## Bloque 3 — Optimistic updates en detalle de tarea

### Estado actual
Ya existe optimistic update al vincular/desvincular notas y eventos, pero hay que verificar que el flujo de rollback funcione correctamente en todos los casos.

### Checklist de verificación

**Vincular nota:**
- [ ] Se agrega localmente antes de confirmar con el backend
- [ ] Si el `POST` falla → se elimina del estado local
- [ ] Si el `POST` falla → se llama `GET /api/tasks/{id}/related` para sincronizar

**Vincular evento:**
- [ ] Se agrega localmente antes de confirmar con el backend
- [ ] Si el `POST` falla → se elimina del estado local
- [ ] Si el `POST` falla → se llama `GET /api/tasks/{id}/related` para sincronizar

**Desvincular nota / evento:**
- [ ] Se elimina localmente antes de confirmar con el backend
- [ ] Si el `DELETE` falla → se restaura en el estado local
- [ ] Si el `DELETE` falla → se llama `GET /api/tasks/{id}/related` para sincronizar

### Patrón recomendado

```ts
const linkNote = async (noteId: string) => {
  // 1. Snapshot del estado actual
  const previous = detailState.notes

  // 2. Optimistic update
  setNotes(prev => [...prev, optimisticNote])

  try {
    await postTaskNote(taskId, noteId)
    // 3a. Éxito — confirmar con el endpoint ligero
    const related = await fetchRelated(taskId)
    setNotes(related.notes)
  } catch {
    // 3b. Fallo — rollback
    setNotes(previous)
  }
}
```

---

## Bloque 4 — Rediseño UI del detalle de tarea

### Principios
- Todo visible a la vez (no tabs)
- Quitar bordes donde no aporten separación real
- Responsivo: 2 columnas en desktop, 1 columna en móvil
- El sidebar de navegación se mantiene

### Layout propuesto

```
┌─ Sidebar ─┬──────────────────────────────────────────┐
│           │  ← Detalle de Tarea                      │
│           │                                           │
│           │  [Título]                    [Eliminar]  │
│           │  [fecha · prioridad · etiquetas]          │
│           │                                           │
│           │  Descripción                              │
│           │  [textarea, fondo sutil, sin borde]       │
│           │                                           │
│           │  ── ── ── ── ── ── ── ── ── ── ── ──     │
│           │                                           │
│           │  Notas vinculadas         [+ Crear]       │
│           │  [cards compactas sin borde exterior]     │
│           │                                           │
│           │  Eventos vinculados       [+ Vincular]    │
│           │  [cards compactas sin borde exterior]     │
└───────────┴───────────────────────────────────────────┘
```

### Cambios específicos

**Quitar:**
- Border del card principal de la tarea
- Border exterior de las secciones "Notas vinculadas" y "Eventos vinculados"
- La separación visual de dos columnas (panel derecho vs izquierdo) — todo fluye en una sola columna

**Mantener:**
- Separador sutil entre secciones (`border-bottom` con baja opacidad)
- Background diferenciado para el área de descripción (sin borde, solo fondo)
- Badges de fecha y prioridad tal como están

**Responsive:**
- `>= 1024px`: layout de 2 columnas (info principal | notas + eventos)
- `< 1024px`: todo en columna única, relaciones van debajo de la info principal

---

## Orden de implementación

```
1. Bloque 1 — consumo del param view (depende: Backend Bloque 1)
      ↓
2. Bloque 2 — infinite scroll + estado de cursor (depende: Backend Bloque 2)
      ↓
3. Bloque 3 — verificar optimistic updates (depende: Backend Bloque 3)
      ↓
4. Bloque 4 — rediseño UI detalle (independiente, puede hacerse en paralelo)
```