import { z } from "zod";
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
export type JsonObject = { [key: string]: JsonValue };

const NoteCategorySchema = z.enum(["grammar", "vocabulary", "culture", "general"]);
const ReadingStatusSchema = z.enum(["inbox", "reading", "completed"]);

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

const NoteBodySchema = z.object({
 title: z.string().trim().min(1),
 tags: z.array(z.string()).default([]),
 category: NoteCategorySchema.default("general"),
 content: JsonObjectSchema,
 readingContent: JsonObjectSchema.nullish(),
 splitViewEnabled: z.boolean().optional(),
});

const NoteExportPayloadV1Schema = z.object({
 version: z.literal(1).default(1),
 exportedAt: z.string().optional(),
 note: NoteBodySchema,
});

export const NoteExportPayloadSchema = z.object({
 version: z.literal(2).default(2),
 exportedAt: z.string().optional(),
 note: NoteBodySchema.extend({
  readingStatus: ReadingStatusSchema.nullish(),
  folder: z
   .object({
    name: z.string().trim().min(1),
    parentName: z.string().trim().min(1).nullable().optional(),
    color: z.enum(["purple", "blue", "green", "orange", "rose", "slate"]),
   })
   .nullable()
   .optional(),
  source: z
   .object({
    url: z.url().nullable(),
    host: z.string().nullable(),
    label: z.string().nullable(),
    author: z.string().nullable(),
    publishedAt: z.string().nullable(),
    capturedAt: z.string().nullable(),
   })
   .nullable()
   .optional(),
 }),
});

export type NoteExportPayload = z.infer<typeof NoteExportPayloadSchema>;

export function normalizeImportedNotePayload(value: unknown): NoteExportPayload {
 const current = NoteExportPayloadSchema.safeParse(value);
 if (current.success) return current.data;

 const legacy = NoteExportPayloadV1Schema.parse(value);
 return {
  version: 2,
  exportedAt: legacy.exportedAt,
  note: {
   ...legacy.note,
   readingStatus: null,
   folder: null,
   source: null,
  },
 };
}
