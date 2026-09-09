import { z } from "zod";
import { JsonObjectSchema } from "@/types/json";

export const readerAnnotationRowSchema = z
 .strictObject({
  id: z.uuid(),
  user_id: z.uuid(),
  document_id: z.string().min(1),
  paragraph_id: z.string().min(1).nullable(),
  asset_id: z.string().min(1).nullable(),
  annotation_type: z.enum(["highlight", "underline", "note", "ink"]),
  page_number: z.number().int().positive().nullable(),
  start_offset: z.number().int().nonnegative().nullable(),
  end_offset: z.number().int().positive().nullable(),
  selected_text: z.string(),
  note_text: z.string(),
  color: z.enum(["yellow", "green", "blue", "pink"]),
  payload: JsonObjectSchema,
  revision: z.number().int().nonnegative(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
  deleted_at: z.iso.datetime({ offset: true }).nullable(),
 })
 .superRefine((value, context) => {
  if (value.paragraph_id === null && value.asset_id === null) {
   context.addIssue({
    code: "custom",
    path: ["paragraph_id"],
    message: "Annotation target is required.",
   });
  }
  if ((value.start_offset === null) !== (value.end_offset === null)) {
   context.addIssue({
    code: "custom",
    path: ["start_offset"],
    message: "Annotation range must be complete.",
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
    message: "Annotation range must be ordered.",
   });
  }
 });

export type ReaderAnnotationRow = z.output<typeof readerAnnotationRowSchema>;
