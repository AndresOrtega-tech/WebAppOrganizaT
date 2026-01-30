export const FEATURE_FLAGS = {
  ENABLE_TASK_CREATION: true,
  ENABLE_TASK_EDITING: true,
  ENABLE_TASK_DELETION: true,
  ENABLE_TASK_DETAIL: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURE_FLAGS[feature];
};
