export const FEATURE_FLAGS = {
  ENABLE_TASK_DETAILS: false, // Muestra el detalle completo de la tarea al hacer click
  ENABLE_TASK_EDIT: false,    // Permite editar título y descripción
  ENABLE_TASK_CREATION: true, // Permite crear nuevas tareas
  ENABLE_TASK_DELETION: true, // Permite eliminar tareas
  ENABLE_REGISTRATION: false, // Permite registrar nuevos usuarios
  ENABLE_USER_PROFILE: true, // Permite ver y editar el perfil de usuario
  ENABLE_TAGS_VIEW: false,    // Permite ver el listado de etiquetas (tags)
  ENABLE_TAG_CREATION: false, // Permite crear nuevas etiquetas
  ENABLE_TAG_EDIT: false,     // Permite editar etiquetas existentes
  ENABLE_TAG_DELETION: false, // Permite eliminar etiquetas
  ENABLE_TASK_TAGS: false,    // Permite asignar etiquetas a tareas
  ENABLE_TASK_FILTERS: false, // Permite flitar tareas por fecha, status y tags
  ENABLE_NOTES_VIEW: false,   // Permite ver el listado de notas
  ENABLE_NOTE_CREATION: false, // Permite crear nuevas notas
  ENABLE_NOTE_DETAIL: false,   // Permite ver el detalle de una nota
  ENABLE_NOTE_EDITING: false, // Permite editar una nota existent
  ENABLE_NOTE_DELETION: false, // Permite eliminar una nota
  ENABLE_NOTE_FILTERS: false, // Permite filtrar notas por tags y fecha
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURE_FLAGS[feature];
};
