export const HANZI_STUDIO_MIGRATION_SOURCE = {
 repository: "lekhanh2099/hanzi-studio",
 commit: "0568e6cd15d868ac968dfe03533d99429a4e9fcf",
 version: "1.5.0",
} as const;

export const HANZI_STUDIO_FEATURE_DISPOSITION = {
 studio: "merge",
 reading: "merge",
 "listening-lab": "merge",
 "practice-lab": "merge-adapt",
 "learning-loop": "move-adapt",
 "personal-learning": "move-adapt",
 radicals: "merge",
 "hanzi-inspector": "move-adapt",
 "contextual-pronunciation": "merge",
 "polyphonic-characters": "move-adapt",
 humanities: "move-adapt",
 "daily-reading": "move-adapt",
 conversation: "move-adapt",
 "ai-settings": "merge",
 "data-quality": "merge",
} as const;

export type HanziStudioSourceFeature = keyof typeof HANZI_STUDIO_FEATURE_DISPOSITION;
