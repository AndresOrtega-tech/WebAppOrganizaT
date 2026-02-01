export const FEATURE_FLAGS = {
  ENABLE_TASK_DETAILS: true, // Muestra el detalle completo de la tarea al hacer click
  ENABLE_TASK_EDIT: true,    // Permite editar título y descripción
  ENABLE_TASK_CREATION: true, // Permite crear nuevas tareas
  ENABLE_TASK_DELETION: true, // Permite eliminar tareas
  ENABLE_REGISTRATION: true, // Permite registrar nuevos usuarios
  ENABLE_USER_PROFILE: true, // Permite ver y editar el perfil de usuario
  ENABLE_TAGS_VIEW: true,    // Permite ver el listado de etiquetas (tags)
  ENABLE_TAG_CREATION: true, // Permite crear nuevas etiquetas
  ENABLE_TAG_EDIT: true,     // Permite editar etiquetas existentes
  ENABLE_TAG_DELETION: true, // Permite eliminar etiquetas
  ENABLE_TASK_TAGS: true,    // Permite asignar etiquetas a tareas
  ENABLE_TASK_FILTERS: true, // Permite flitar tareas por fecha, status y tags
  ENABLE_NOTES_VIEW: true,   // Permite ver el listado de notas
  ENABLE_NOTE_CREATION: true, // Permite crear nuevas notas
  ENABLE_NOTE_DETAIL: true,   // Permite ver el detalle de una nota
  ENABLE_NOTE_EDITING: true, // Permite editar una nota existent
  ENABLE_NOTE_DELETION: true, // Permite eliminar una nota
  ENABLE_NOTE_FILTERS: true, // Permite filtrar notas por tags y fecha
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURE_FLAGS[feature];
};
