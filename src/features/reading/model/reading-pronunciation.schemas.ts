import { z } from "zod";

export const readerPronunciationOverrideRowSchema = z
 .strictObject({
  id: z.uuid(),
  user_id: z.uuid(),
  document_id: z.string().min(1),
  paragraph_id: z.string().min(1),
  text: z.string().min(1),
  readings: z.array(z.string().regex(/^[a-zv]+[1-5]$/u)).min(1),
  scope: z.enum(["character-global", "phrase", "sentence-instance"]),
  sentence_text: z.string().nullable(),
  start_offset: z.number().int().nonnegative().nullable(),
  end_offset: z.number().int().positive().nullable(),
  revision: z.number().int().nonnegative(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
 })
 .superRefine((value, context) => {
  if (
   value.scope === "sentence-instance" &&
   (value.sentence_text === null || value.start_offset === null || value.end_offset === null)
  ) {
   context.addIssue({
    code: "custom",
    path: ["sentence_text"],
    message: "Sentence-instance override coordinates are required.",
   });
  }
  if (
   value.start_offset !== null &&
   value.end_offset !== null &&
   value.end_offset <= value.start_offset
  ) {
   context.addIssue({
    code: "custom",
    path: ["end_offset"],
    message: "Override range must be ordered.",
   });
  }
 });

export type ReaderPronunciationOverrideRow = z.output<typeof readerPronunciationOverrideRowSchema>;
