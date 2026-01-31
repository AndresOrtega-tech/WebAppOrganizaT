export const FEATURE_FLAGS = {
  ENABLE_TASK_DETAILS: true, // Muestra el detalle completo de la tarea al hacer click
  ENABLE_TASK_EDIT: true,    // Permite editar título y descripción
  ENABLE_TASK_CREATION: true, // Permite crear nuevas tareas
  ENABLE_TASK_DELETION: false, // Permite eliminar tareas
  ENABLE_REGISTRATION: false, // Permite registrar nuevos usuarios
  ENABLE_USER_PROFILE: false, // Permite ver y editar el perfil de usuario
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURE_FLAGS[feature];
};
