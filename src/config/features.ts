export const FEATURE_FLAGS = {
  // --- Tareas (Tasks) ---
  ENABLE_TASK_DETAIL: true,      // Muestra el detalle completo de la tarea al hacer click
  ENABLE_TASK_CREATION: true,     // Permite crear nuevas tareas
  ENABLE_TASK_EDIT: true,         // Permite editar título y descripción
  ENABLE_TASK_DELETION: true,     // Permite eliminar tareas
  ENABLE_TASK_FILTERS: true,      // Permite filtrar tareas por fecha, status y tags
  ENABLE_TASK_TAGS: true,        // Permite asignar etiquetas a tareas
  ENABLE_TASK_CONTEXT_MENU: true, // Permite abrir menú contextual en tareas
  ENABLE_TASK_NOTE_LINKING: true, // Permite vincular notas a tareas y viceversa
  ENABLE_AI_REFORMULATION: true,  // Permite reformular descripción de tarea con IA

  // --- Etiquetas (Tags) ---
  ENABLE_TAGS_VIEW: true,    // Permite ver el listado de etiquetas (tags)
  ENABLE_TAG_CREATION: true, // Permite crear nuevas etiquetas
  ENABLE_TAG_EDIT: true,     // Permite editar etiquetas existentes
  ENABLE_TAG_DELETION: true, // Permite eliminar etiquetas

  // --- Notas (Notes) ---
  ENABLE_NOTES_VIEW: true,    // Permite ver el listado de notas
  ENABLE_NOTE_CREATION: true, // Permite crear nuevas notas
  ENABLE_NOTE_DETAIL: true,   // Permite ver el detalle de una nota
  ENABLE_NOTE_EDIT: true,     // Permite editar una nota existente
  ENABLE_NOTE_DELETION: true, // Permite eliminar una nota
  ENABLE_NOTE_FILTERS: true,  // Permite filtrar notas por tags y fecha
  ENABLE_NOTE_AI_REFORMULATION: true, // Permite reformular contenido de nota con IA
  
  // --- Eventos (Events) ---
  ENABLE_EVENTS_VIEW: true, // Permite ver el listado de eventos
  ENABLE_EVENT_CREATION: true, // Permite crear nuevos eventos
  ENABLE_EVENT_DETAIL: true, // Permite ver el detalle de un evento
  ENABLE_EVENT_EDIT: true,    // Permite editar un evento existente
  ENABLE_EVENT_DELETION: true, // Permite eliminar un evento
  ENABLE_EVENT_LINKING: true, // Permite vincular eventos a tareas y notas, y viceversa
  ENABLE_EVENT_FILTERS: true, // Permite filtrar eventos por fecha
  ENABLE_EVENT_AI_REFORMULATION: true, // Permite reformular descripción de evento con IA

  // --- Usuarios / Auth ---
  ENABLE_REGISTRATION: true, // Permite registrar nuevos usuarios
  ENABLE_USER_PROFILE: true, // Permite ver y editar el perfil de usuario

  // --- UI / UX ---
  ENABLE_DARK_MODE: true,     // Permite cambiar entre modo claro y oscuro
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURE_FLAGS[feature];
};
