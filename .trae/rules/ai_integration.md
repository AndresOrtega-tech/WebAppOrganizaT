# Integración de IA (Gemini)

Documentación sobre el uso de Google Gemini para reformulación de texto.

## Configuración
- **Modelo:** `gemini-2.5-flash`
- **Endpoint:** `/api/ai/reformulate`
- **Cliente:** `GoogleGenAI` (SDK oficial)

## Límites y Restricciones
Para mantener la consistencia y rendimiento, se aplican límites estrictos de caracteres en la generación:

- **Notas:** Máximo **800** caracteres.
- **Tareas:** Máximo **500** caracteres.

## Lógica de Reintento
El backend implementa un mecanismo de "Retry Loop" (máximo 3 intentos) si la respuesta de la IA excede el límite:

1. **Intento 1:** Prompt normal.
2. **Intento 2-3:** Se añade instrucción explícita: `PREVIOUS ATTEMPT WAS TOO LONG. MUST BE UNDER {limit} CHARACTERS.`
3. **Fallback:** Si falla tras 3 intentos, se trunca el texto al límite definido.

## Implementación Frontend
- **Hook:** `useAiReformulation` maneja la llamada a la API y el estado de carga.
- **Componente:** `AiReformulateButton` (visible solo si hay texto y feature flag activa).
- **Validación Visual:** Los formularios (`NoteModal`, `TaskEditModal`) muestran contadores de caracteres y limitan el `maxLength` manualmente.
