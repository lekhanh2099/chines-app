import { z } from "zod";
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
export type JsonObject = { [key: string]: JsonValue };

const NoteCategorySchema = z.enum(["grammar", "vocabulary", "culture", "general"]);

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
 z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(JsonValueSchema),
  z.record(z.string(), JsonValueSchema),
 ]),
);

export const JsonObjectSchema: z.ZodType<JsonObject> = z.record(z.string(), JsonValueSchema);

export const NoteExportPayloadSchema = z.object({
 version: z.literal(1).default(1),
 exportedAt: z.string().optional(),
 note: z.object({
  title: z.string().trim().min(1),
  tags: z.array(z.string()).default([]),
  category: NoteCategorySchema.default("general"),
  content: JsonObjectSchema,
  readingContent: JsonObjectSchema.nullish(),
  splitViewEnabled: z.boolean().optional(),
 }),
});

export type NoteExportPayload = z.infer<typeof NoteExportPayloadSchema>;

export function normalizeImportedNotePayload(value: unknown): NoteExportPayload {
 return NoteExportPayloadSchema.parse(value);
}
