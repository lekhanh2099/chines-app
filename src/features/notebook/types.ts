import { z } from "zod";

export const NotebookSectionIdSchema = z.enum([
 "conjunctions",
 "adverbs",
 "pronouns",
 "prepositions",
 "particles",
 "discourse",
 "advanced",
 "grammar_q2",
]);

export const NotebookGroupSchema = z.object({
 id: z.string(),
 name: z.string(),
});

export const NotebookDeepDiveSourceSchema = z.enum([
 "prepositions",
 "particles",
 "discourse",
 "allset",
 "wordorder",
 "contrast",
 "condition",
 "choice",
 "adverbs",
 "pronouns",
 "textbook",
 "grammar_q2",
 "phase4",
]);

export const NotebookDeepDiveSchema = z.object({
 why: z.string(),
 pos: z.string(),
 decision: z.string(),
 mistake: z.string(),
 src: z.array(NotebookDeepDiveSourceSchema),
});

export const NotebookTermSchema = z.object({
 g: z.string(),
 term: z.string(),
 p: z.string(),
 vi: z.string(),
 essence: z.string(),
 pattern: z.string(),
 use: z.string(),
 avoid: z.string(),
 tags: z.array(z.string()),
 ex: z.tuple([z.string(), z.string(), z.string()]),
 why: z.string().optional(),
 pos: z.string().optional(),
 decision: z.string().optional(),
 mistake: z.string().optional(),
 src: z.array(NotebookDeepDiveSourceSchema).optional(),
});

export const NotebookComparisonSchema = z.object({
 title: z.string(),
 note: z.string(),
 terms: z.array(z.string()),
 rule: z.string(),
 danger: z.string(),
});

export const NotebookSectionSchema = z.object({
 label: z.string(),
 zh: z.string(),
 desc: z.string(),
 principles: z.array(z.string()),
 quick: z.array(z.tuple([z.string(), z.string()])),
 groups: z.array(NotebookGroupSchema),
 terms: z.array(NotebookTermSchema),
 compares: z.array(NotebookComparisonSchema),
});

export const NotebookSeedDataSchema = z.object({
 conjunctions: NotebookSectionSchema,
 adverbs: NotebookSectionSchema,
 pronouns: NotebookSectionSchema,
 prepositions: NotebookSectionSchema,
 particles: NotebookSectionSchema,
 discourse: NotebookSectionSchema,
 advanced: NotebookSectionSchema,
 grammar_q2: NotebookSectionSchema,
});

export type NotebookSectionId = z.infer<typeof NotebookSectionIdSchema>;
export type NotebookGroup = z.infer<typeof NotebookGroupSchema>;
export type NotebookDeepDive = z.infer<typeof NotebookDeepDiveSchema>;
export type NotebookDeepDiveSource = z.infer<typeof NotebookDeepDiveSourceSchema>;
export type NotebookTerm = z.infer<typeof NotebookTermSchema>;
export type NotebookComparison = z.infer<typeof NotebookComparisonSchema>;
export type NotebookSection = z.infer<typeof NotebookSectionSchema>;
export type NotebookSeedData = z.infer<typeof NotebookSeedDataSchema>;
export const NotebookViewModeSchema = z.enum(["cards", "compare", "matrix"]);
export type NotebookViewMode = z.infer<typeof NotebookViewModeSchema>;

export type NotebookItem = NotebookTerm & {
 id: string;
 sectionId: NotebookSectionId;
};

export type NotebookComparisonItem = NotebookComparison & {
 id: string;
 sectionId: NotebookSectionId;
};
