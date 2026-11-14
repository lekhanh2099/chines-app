import { z } from "zod";

export const learningLoopItemKindSchema = z.enum([
 "dictation_mistake",
 "vocabulary",
 "reading_bookmark",
 "shadowing",
 "minimal_contrast",
 "error_correction",
 "sentence_transformation",
 "guided_production",
 "timed_production",
 "delayed_transfer",
]);
