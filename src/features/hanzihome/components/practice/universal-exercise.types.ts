import { z } from "zod";

const ChoiceOptionSchema = z.object({
 key: z.string(),
 label: z.string(),
});

const ClozeInteractionSchema = z.object({
 type: z.literal("cloze"),
 expectedAnswer: z.string(),
 placeholder: z.string().optional(),
 preText: z.string().optional(),
 postText: z.string().optional(),
});

const ChoiceInteractionSchema = z.object({
 type: z.literal("choice"),
 options: z.array(ChoiceOptionSchema),
 correctKey: z.string(),
});

const ReorderInteractionSchema = z.object({
 type: z.literal("reorder"),
 tokens: z.array(z.string()),
 correctOrder: z.array(z.string()),
});

const OpenInteractionSchema = z.object({
 type: z.literal("open"),
 suggestedAnswer: z.string(),
});

const UniversalInteractionSchema = z.discriminatedUnion("type", [
 ClozeInteractionSchema,
 ChoiceInteractionSchema,
 ReorderInteractionSchema,
 OpenInteractionSchema,
]);
export type UniversalInteraction = z.infer<typeof UniversalInteractionSchema>;

const UniversalExerciseCategorySchema = z.enum([
 "vocab_cloze",
 "practice_cloze",
 "practice_choice",
 "practice_reorder",
 "practice_open",
 "custom",
]);

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
