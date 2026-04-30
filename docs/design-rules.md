# Reglas de Diseño

## Objetivo

Este documento define las reglas visuales y de experiencia para OrganizaT.
Su propósito es mantener consistencia entre páginas, componentes y futuras features sin rediseñar cada pantalla desde cero.

Estas reglas están basadas en el frontend actual del proyecto y deben tratarse como fuente de verdad para decisiones de UI.

---

## Principios

### 1. Claridad antes que decoración

La interfaz debe priorizar lectura rápida, jerarquía clara y acciones evidentes.
Los elementos visuales decorativos solo se justifican si mejoran orientación, feedback o reconocimiento del estado.

### 2. Productividad visual

OrganizaT es una app de organización personal.
La UI debe sentirse rápida, enfocada y estable.
Evitar pantallas recargadas, ruido visual innecesario y patrones que distraigan del contenido principal.

### 3. Consistencia entre entidades

Tareas, notas, eventos y etiquetas comparten lenguaje visual.
Cada entidad puede tener color semántico propio, pero la estructura de cards, badges, espaciados y navegación debe mantenerse coherente.

### 4. Dark mode como ciudadano de primera clase

Todo componente nuevo debe diseñarse para light y dark mode desde el inicio.
No se acepta una versión “adaptada después” si rompe contraste, profundidad o legibilidad.

---

## Tipografía

### Regla general

- Usar la tipografía cargada en el layout global con Geist Sans y Geist Mono.
- Mantener una jerarquía clara entre títulos, subtítulos, labels, metadata y texto de apoyo.
- Evitar mezclar familias tipográficas nuevas sin una decisión explícita de sistema.

### Jerarquía recomendada

- Título principal de página: `text-2xl` a `text-3xl`, `font-bold`
- Título de sección: `text-xl` a `text-2xl`, `font-bold` o `font-semibold`
- Título de card: `text-base` a `text-lg`, `font-bold`
- Texto principal: `text-sm` a `text-base`
- Metadata y texto auxiliar: `text-xs` a `text-sm`

### Reglas de uso

- Los títulos deben ser cortos y escaneables.
- La metadata nunca debe competir visualmente con el contenido principal.
- El texto secundario debe usar grises, no negro puro.

---

## Color

### Paleta funcional actual

- Primario de producto: `indigo`
- Eventos: `purple` o `emerald` según contexto visual actual
- Notas: `amber`
- Estados críticos: `red`
- Estados exitosos: `green`
- Estados medios o advertencias: `yellow`
- Neutros: escala `gray`

### Reglas

- El color primario debe reservarse para acciones principales, acentos de marca y focos de atención.
- Cada entidad puede tener un color de reconocimiento, pero no debe romper la jerarquía global.
- No usar colores saturados sobre fondos saturados sin suficiente contraste.
- El dark mode debe conservar intención semántica, no solo invertir colores.

### Semántica mínima

- `alta`: rojo
- `media`: amarillo
- `baja`: verde
- acción principal: indigo
- información contextual o navegación secundaria: neutros + color de entidad

---

## Superficie y profundidad

### Fondos

- Las páginas deben usar fondos sobrios y consistentes.
- Las superficies principales deben distinguirse del fondo con contraste suave, no con sombras agresivas.

### Cards

- Las cards son el patrón base del sistema.
- Deben usar bordes suaves, separación clara del fondo y padding generoso.
- En light mode: fondo blanco con borde gris muy suave.
- En dark mode: fondo `gray-900` o equivalente con borde `gray-800`.

### Sombras

- Usar sombras pequeñas o medianas para indicar elevación, no protagonismo.
- Hover states pueden aumentar sutilmente la sombra.
- Evitar sombras grandes y difusas como estilo por defecto.

---

## Bordes y radios

### Radios

- El lenguaje visual actual usa radios amplios.
- Botones, inputs y chips: `rounded-xl`
- Cards y contenedores principales: `rounded-2xl`
- Elementos destacados o contenedores grandes: `rounded-3xl` cuando tenga sentido estructural

### Reglas

- No mezclar radios duros con superficies blandas dentro de una misma zona.
- Mantener el mismo radio entre componentes equivalentes.

---

## Espaciado

### Regla general

- El espaciado debe seguir ritmo visual consistente basado en múltiplos de 2 y 4.
- El contenido no debe sentirse comprimido ni excesivamente separado.

### Guía práctica

- Entre bloques principales: `mb-6` a `mb-8`
- Padding interno de cards: `p-4` a `p-6`
- Gap entre controles: `gap-2` a `gap-4`
- Metadata bajo títulos: `mt-1` o `mt-2`

### Reglas

- Si una card tiene información densa, aumentar padding antes que reducir tipografía.
- El espacio debe usarse para separar intención, no solo elementos.

---

## Componentes

### Botones

- El botón primario debe usar el color principal de marca.
- El botón secundario debe apoyarse en fondo tenue, borde sutil o texto coloreado.
- Los botones destructivos deben comunicar riesgo con rojo, sin abusar del color si no hay irreversibilidad.

### Inputs y textareas

- Deben tener fondo consistente con la superficie donde viven.
- El estado de foco debe ser visible, preferentemente con borde o ring relacionado al color primario.
- Los placeholders deben verse como ayuda, no como contenido.

### Badges

- Los badges deben comunicar estado o categoría, nunca usarse como decoración vacía.
- Prioridad, archivado, atraso y estados de completitud deben tener representación consistente.

### Tags

- Las etiquetas deben respetar su color propio.
- El color debe aplicarse con fondo muy tenue, borde semitransparente y texto legible.
- Nunca renderizar una tag con un fondo tan opaco que opaque su texto.

### Íconos

- Usar `lucide-react` como set principal.
- Los íconos deben apoyar la comprensión del elemento, no duplicar lo que ya dice el texto salvo en navegación o acciones rápidas.
- Tamaños recomendados: `w-4 h-4`, `w-5 h-5`, `w-6 h-6` según jerarquía.

---

## Navegación

### Navbar

- La navegación superior debe sentirse liviana, limpia y estable.
- El branding de OrganizaT puede usar gradiente, pero las acciones del navbar deben mantener sobriedad.
- Accesos rápidos por entidad pueden usar color semántico de cada módulo.

### Sidebars y paneles

- Deben priorizar agrupación lógica y reconocimiento rápido.
- Los grupos de navegación o filtros deben tener labels claros y separación visible entre secciones.

---

## Listados y cards de contenido

### Tareas

- Una tarea debe mostrar primero título, luego prioridad, fecha y estado.
- El estado de completitud debe ser visible sin abrir el detalle.
- Las tareas atrasadas deben destacarse con alerta clara pero controlada.

### Eventos

- Un evento debe priorizar título, fecha/hora y lugar.
- Si hay demasiada metadata, primero se muestra inicio; el resto se revela progresivamente.

### Notas

- Una nota debe priorizar título y resumen o preview del contenido.
- El contenido en preview debe truncarse de forma elegante y legible.

### Reglas comunes

- Las cards deben permitir escaneo rápido en vista de lista.
- La acción principal de una card debe ser evidente: abrir detalle, editar o contextual menu.

---

## Markdown y contenido enriquecido

- El markdown debe renderizarse con estilos mínimos y legibles.
- Las listas, negritas y headings embebidos deben integrarse con el sistema visual, no parecer contenido externo.
- El texto largo dentro de cards debe clampse o resumirse para no romper densidad visual.

---

## Motion y feedback

### Regla general

- Toda animación debe tener propósito: foco, feedback, transición o jerarquía.
- Evitar animaciones largas, elásticas o distractoras en flujos de productividad.

### Recomendaciones

- Hover: cambios suaves de color, sombra o borde
- Focus: borde o ring claro
- Aparición: transiciones cortas y discretas
- Menús contextuales y modales: movimiento corto y consistente

---

## Accesibilidad

- Garantizar contraste suficiente en light y dark mode.
- No depender solo del color para comunicar estado.
- Todo control interactivo debe tener área clickeable cómoda.
- Los botones con solo ícono deben tener `aria-label`.
- El foco de teclado debe ser visible siempre.

---

## Responsive

- Diseñar mobile-first cuando el componente lo requiera.
- En pantallas pequeñas, reducir ruido antes que comprimir contenido crítico.
- Los bloques deben colapsar de forma natural: primero acciones secundarias, luego metadata menos importante.
- Evitar layouts que dependan de hover para funciones esenciales en mobile.

---

## Reglas de implementación

- Seguir Tailwind como capa principal de estilos.
- Reutilizar patrones existentes antes de inventar uno nuevo.
- Si un nuevo componente introduce una excepción visual, debe justificarse por contexto de negocio o usabilidad.
- Si una regla nueva se vuelve recurrente, actualizar este documento.

---

## Checklist de revisión visual

Antes de cerrar un cambio de UI, verificar:

- ¿Respeta light y dark mode?
- ¿Usa la jerarquía tipográfica correcta?
- ¿Mantiene radios y espaciados del sistema?
- ¿La acción principal se entiende en menos de 2 segundos?
- ¿El color comunica estado real y no decoración gratuita?
- ¿Se ve consistente con tareas, notas, eventos y chat?
- ¿Se puede usar bien en mobile?
- ¿Tiene foco visible y labels accesibles?

---

## Evolución del documento

Este documento no es estático.
Si el producto define un design system más formal, tokens globales o componentes base compartidos, este archivo debe actualizarse para reflejar esa fuente de verdad.