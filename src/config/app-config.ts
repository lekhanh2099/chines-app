export const appConfig = {
 features: {
  dashboard: true,
  courses: true,
  vocabulary: true,
  practice: false,
  settings: true,
  notes: true,
  dictionary: true,
  grammar: true,
 },
} as const;

export type FeatureKey = keyof typeof appConfig.features;
