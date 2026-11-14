import { z } from "zod";

export const ChoiceOptionSchema = z.object({
 key: z.string(),
 label: z.string(),
});
export type ChoiceOption = z.infer<typeof ChoiceOptionSchema>;

export const ClozeInteractionSchema = z.object({
 type: z.literal("cloze"),
 expectedAnswer: z.string(),
 placeholder: z.string().optional(),
 preText: z.string().optional(),
 postText: z.string().optional(),
});
export type ClozeInteraction = z.infer<typeof ClozeInteractionSchema>;

export const ChoiceInteractionSchema = z.object({
 type: z.literal("choice"),
 options: z.array(ChoiceOptionSchema),
 correctKey: z.string(),
});
export type ChoiceInteraction = z.infer<typeof ChoiceInteractionSchema>;

export const ReorderInteractionSchema = z.object({
 type: z.literal("reorder"),
 tokens: z.array(z.string()),
 correctOrder: z.array(z.string()),
});
export type ReorderInteraction = z.infer<typeof ReorderInteractionSchema>;

export const OpenInteractionSchema = z.object({
 type: z.literal("open"),
 suggestedAnswer: z.string(),
});
export type OpenInteraction = z.infer<typeof OpenInteractionSchema>;

export const UniversalInteractionSchema = z.discriminatedUnion("type", [
 ClozeInteractionSchema,
 ChoiceInteractionSchema,
 ReorderInteractionSchema,
 OpenInteractionSchema,
]);
export type UniversalInteraction = z.infer<typeof UniversalInteractionSchema>;

export const UniversalExerciseCategorySchema = z.enum([
 "vocab_cloze",
 "practice_cloze",
 "practice_choice",
 "practice_reorder",
 "practice_open",
 "custom",
]);
export type UniversalExerciseCategory = z.infer<typeof UniversalExerciseCategorySchema>;

export const UniversalExerciseItemSchema = z.object({
 id: z.string(),
 category: UniversalExerciseCategorySchema,
 title: z.string().optional(),
 prompt: z.string(),
 promptTranslation: z.string().optional(),
 hint: z.string().optional(),
 explanation: z.string().optional(),
 audioText: z.string().optional(),
 interaction: UniversalInteractionSchema,
});
export type UniversalExerciseItem = z.infer<typeof UniversalExerciseItemSchema>;

export type InteractionComponentProps = {
 readonly item: UniversalExerciseItem;
 readonly value: string;
 readonly isSubmitted: boolean;
 readonly isCorrect?: boolean;
 readonly onChange: (value: string) => void;
 readonly onSubmit: () => void;
};
