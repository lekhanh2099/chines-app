import { z } from "zod";

export const aiConversationMemoryKindSchema = z.enum([
 "fact",
 "preference",
 "habit",
 "goal",
 "episode",
 "open_loop",
 "inside_joke",
]);

export const aiConversationMemoryActionSchema = z.enum([
 "ignore",
 "add",
 "reinforce",
 "supersede",
 "resolve",
 "forget",
]);

export const aiConversationMemoryScopeSchema = z.enum(["global", "character"]);

export const aiConversationMemoryCandidateSchema = z
 .strictObject({
  action: aiConversationMemoryActionSchema,
  kind: aiConversationMemoryKindSchema.nullable(),
  targetMemoryId: z.uuid().nullable(),
  memoryKey: z.string().trim().min(1).max(120).nullable(),
  content: z.string().trim().min(1).max(600).nullable(),
  importance: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  scope: aiConversationMemoryScopeSchema,
 })
 .superRefine((candidate, context) => {
  if (candidate.action === "ignore" || candidate.action === "forget") return;

  if (!candidate.kind) {
   context.addIssue({
    code: "custom",
    path: ["kind"],
    message: "Memory kind is required for this lifecycle action.",
   });
  }

  if ((candidate.action === "add" || candidate.action === "supersede") && !candidate.content) {
   context.addIssue({
    code: "custom",
    path: ["content"],
    message: "Memory content is required for add/supersede.",
   });
  }

  if (
   (candidate.action === "reinforce" ||
    candidate.action === "resolve" ||
    candidate.action === "supersede") &&
   !candidate.targetMemoryId &&
   !candidate.memoryKey
  ) {
   context.addIssue({
    code: "custom",
    path: ["targetMemoryId"],
    message: "A target memory id or canonical memory key is required.",
   });
  }
 });

export const aiConversationMemoryExtractionSchema = z.strictObject({
 changes: z.array(aiConversationMemoryCandidateSchema).max(6),
});

export const aiConversationStoredMemorySchema = z.strictObject({
 id: z.uuid(),
 characterId: z.uuid().nullable(),
 kind: aiConversationMemoryKindSchema,
 memoryKey: z.string().nullable(),
 content: z.string().trim().min(1),
 importance: z.number().min(0).max(1),
 confidence: z.number().min(0).max(1),
 reinforcementCount: z.number().int().positive(),
 updatedAt: z.iso.datetime({ offset: true }),
});

export const aiConversationRecalledMemorySchema = aiConversationStoredMemorySchema.extend({
 similarity: z.number().min(-1).max(1).nullable(),
});

export type AiConversationMemoryKind = z.output<typeof aiConversationMemoryKindSchema>;
export type AiConversationMemoryAction = z.output<typeof aiConversationMemoryActionSchema>;
export type AiConversationMemoryScope = z.output<typeof aiConversationMemoryScopeSchema>;
export type AiConversationMemoryCandidate = z.output<typeof aiConversationMemoryCandidateSchema>;
export type AiConversationMemoryExtraction = z.output<typeof aiConversationMemoryExtractionSchema>;
export type AiConversationStoredMemory = z.output<typeof aiConversationStoredMemorySchema>;
export type AiConversationRecalledMemory = z.output<typeof aiConversationRecalledMemorySchema>;
