import { z } from "zod";

export const readerSourceKindSchema = z.enum([
 "reader-resource",
 "lesson",
 "article",
 "plain-text",
 "conversation",
]);
export const readerSegmentKindSchema = z.enum([
 "paragraph",
 "sentence",
 "dialogue-turn",
 "quote",
 "heading",
]);
export const readerCapabilitySchema = z.enum([
 "pinyin",
 "translation",
 "vocabulary",
 "exercises",
 "analysis",
 "summary",
]);
export const readerSourceSchema = z.strictObject({
 kind: readerSourceKindSchema,
 sourceId: z.string().optional(),
 href: z.string().optional(),
 label: z.string().optional(),
});
export const readerSpeakerSchema = z.strictObject({ id: z.string().optional(), label: z.string() });
export const readerSegmentSchema = z.strictObject({
 id: z.string().min(1),
 kind: readerSegmentKindSchema,
 sectionId: z.string().min(1).optional(),
 zh: z.string().min(1),
 pinyin: z.string().optional(),
 vi: z.string().optional(),
 role: z.string().optional(),
 speaker: readerSpeakerSchema.optional(),
 speechText: z.string().optional(),
});
export const readerSectionSchema = z.strictObject({
 id: z.string().min(1),
 title: z.string(),
 segmentIds: z.array(z.string().min(1)).readonly(),
});
export const readerMetadataSchema = z.strictObject({
 id: z.string(),
 label: z.string(),
 value: z.string(),
});
export const readerDocumentSchema = z
 .strictObject({
  id: z.string().min(1),
  language: z.literal("zh-CN"),
  source: readerSourceSchema,
  title: z.string().optional(),
  titlePinyin: z.string().optional(),
  titleVi: z.string().optional(),
  sections: z.array(readerSectionSchema).readonly(),
  segments: z.array(readerSegmentSchema).readonly(),
  metadata: z.array(readerMetadataSchema).readonly(),
  capabilities: z.array(readerCapabilitySchema).readonly(),
 })
 .superRefine((document, ctx) => {
  const segmentIds = new Set(document.segments.map((segment) => segment.id));
  const sectionIds = new Set(document.sections.map((section) => section.id));
  if (
   segmentIds.size !== document.segments.length ||
   sectionIds.size !== document.sections.length
  ) {
   ctx.addIssue({ code: "custom", message: "Duplicate Reader IDs" });
  }
  const assigned = new Set<string>();
  for (const section of document.sections) {
   for (const id of section.segmentIds) {
    const segment = document.segments.find((item) => item.id === id);
    if (
     !segment ||
     assigned.has(id) ||
     (segment.sectionId !== undefined && segment.sectionId !== section.id)
    ) {
     ctx.addIssue({ code: "custom", message: "Invalid Reader section reference" });
    }
    assigned.add(id);
   }
  }
  for (const segment of document.segments) {
   if (
    segment.sectionId !== undefined &&
    (!sectionIds.has(segment.sectionId) ||
     !document.sections
      .find((section) => section.id === segment.sectionId)
      ?.segmentIds.includes(segment.id))
   ) {
    ctx.addIssue({ code: "custom", message: "Invalid Reader segment section" });
   }
  }
 });

export const readerRawSegmentSchema = readerSegmentSchema
 .partial({ id: true, kind: true, zh: true })
 .extend({
  hanzi: z.string().min(1).optional(),
  translation: z.string().optional(),
 })
 .superRefine((segment, ctx) => {
  if (!(segment.zh ?? segment.hanzi)?.trim())
   ctx.addIssue({ code: "custom", message: "Reader text is required" });
  if (segment.zh !== undefined && segment.hanzi !== undefined && segment.zh !== segment.hanzi)
   ctx.addIssue({ code: "custom", message: "Conflicting Reader text aliases" });
  if (
   segment.vi !== undefined &&
   segment.translation !== undefined &&
   segment.vi !== segment.translation
  )
   ctx.addIssue({ code: "custom", message: "Conflicting Reader translation aliases" });
 });
export const readerDataSchema = z.union([
 z.string(),
 z.array(z.string()).readonly(),
 z.array(readerRawSegmentSchema).readonly(),
 readerDocumentSchema,
]);
export const cookReaderOptionsSchema = z.strictObject({
 pronunciation: z.enum(["source-only", "generate-missing"]).default("source-only"),
});
export const readerContentSchema = z.strictObject({
 id: z.string().min(1),
 language: z.literal("zh-CN"),
 source: readerSourceSchema,
 title: z
  .strictObject({
   zh: z.string().optional(),
   pinyin: z.string().optional(),
   vi: z.string().optional(),
  })
  .optional(),
 segmentIds: z.array(z.string()).readonly(),
 segmentsById: z.record(z.string(), readerSegmentSchema).readonly(),
 sectionIds: z.array(z.string()).readonly(),
 sectionsById: z.record(z.string(), readerSectionSchema).readonly(),
 metadata: z.array(readerMetadataSchema).readonly(),
 capabilities: z.array(readerCapabilitySchema).readonly(),
});
export type ReaderDataInput = z.input<typeof readerDataSchema>;
export type ReaderContentState = z.output<typeof readerContentSchema>;
export type CookReaderDataOptions = z.input<typeof cookReaderOptionsSchema>;
export const readerStateSchema = z.strictObject({
 content: readerContentSchema,
 navigation: z.strictObject({
  activeIndex: z.number().int().nonnegative(),
  activeSegmentId: z.string().nullable(),
  positionSource: z.enum(["initial", "command", "playback", "scroll"]),
 }),
 playback: z.strictObject({
  segmentId: z.string().nullable(),
  status: z.enum(["idle", "loading", "playing", "paused"]),
  startOffset: z.number().int().nonnegative(),
  progress: z.number().min(0).max(1),
  rate: z.number().positive(),
  loopCurrent: z.boolean(),
  autoAdvance: z.boolean(),
  error: z.string().nullable(),
 }),
 ui: z.strictObject({ outlineOpen: z.boolean(), focusMode: z.boolean() }),
});
export type ReaderState = z.output<typeof readerStateSchema>;
