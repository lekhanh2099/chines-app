import { z } from "zod";

function optionalTrimmedString() {
 return z.string().trim().optional();
}

function requireAtLeastOneField<T extends Record<string, unknown>>(value: T) {
 return Object.values(value).some((fieldValue) => fieldValue !== undefined);
}

const optionalTextArraySchema = z.array(z.string().trim()).optional();

export const updateVocabCorePayloadSchema = z
 .object({
  itemOrder: z.number().int().positive().optional(),
  word: z.string().trim().min(1, "Thiếu từ tiếng Trung").optional(),
  pinyin: z.string().trim().min(1, "Thiếu pinyin").optional(),
  hanViet: optionalTrimmedString(),
  meaning: z.string().trim().min(1, "Thiếu nghĩa").optional(),
  category: z.string().trim().min(1, "Thiếu nhóm từ").optional(),
  level: optionalTrimmedString(),
  posVi: optionalTrimmedString(),
  posZh: optionalTrimmedString(),
  tone: optionalTrimmedString(),
 })
 .strict()
 .refine(requireAtLeastOneField, "Payload phải có ít nhất một field.");

export const updateVocabExamplePayloadSchema = z
 .object({
  exampleOrder: z.number().int().positive().optional(),
  zh: z.string().trim().min(1, "Thiếu câu tiếng Trung").optional(),
  pinyin: optionalTrimmedString(),
  vi: optionalTrimmedString(),
  note: optionalTrimmedString(),
 })
 .strict()
 .refine(requireAtLeastOneField, "Payload phải có ít nhất một field.");

export const updateVocabDetailSectionPayloadSchema = z
 .object({
  sectionKey: z.string().trim().min(1, "Thiếu section key").optional(),
  title: z.string().trim().min(1, "Thiếu tiêu đề").optional(),
  lines: optionalTextArraySchema,
  sectionOrder: z.number().int().positive().optional(),
 })
 .strict()
 .refine(requireAtLeastOneField, "Payload phải có ít nhất một field.");

export const updateGrammarCorePayloadSchema = z
 .object({
  pointOrder: z.number().int().positive().optional(),
  title: z.string().trim().min(1, "Thiếu tiêu đề").optional(),
  cleanTitle: z.string().trim().min(1, "Thiếu tiêu đề sạch").optional(),
  core: optionalTrimmedString(),
  contentMd: optionalTrimmedString(),
  structuresView: optionalTextArraySchema,
  notes: optionalTextArraySchema,
 })
 .strict()
 .refine(requireAtLeastOneField, "Payload phải có ít nhất một field.");

export const updateGrammarExamplePayloadSchema = z
 .object({
  exampleOrder: z.number().int().positive().optional(),
  zh: z.string().trim().min(1, "Thiếu câu tiếng Trung").optional(),
  pinyin: optionalTrimmedString(),
  vi: optionalTrimmedString(),
  note: optionalTrimmedString(),
 })
 .strict()
 .refine(requireAtLeastOneField, "Payload phải có ít nhất một field.");

export const updateGrammarDetailSectionPayloadSchema = z
 .object({
  sectionKey: z.string().trim().min(1, "Thiếu section key").optional(),
  title: z.string().trim().min(1, "Thiếu tiêu đề").optional(),
  lines: optionalTextArraySchema,
  sectionOrder: z.number().int().positive().optional(),
 })
 .strict()
 .refine(requireAtLeastOneField, "Payload phải có ít nhất một field.");

export type UpdateVocabCorePayload = z.infer<
 typeof updateVocabCorePayloadSchema
>;
export type UpdateVocabExamplePayload = z.infer<
 typeof updateVocabExamplePayloadSchema
>;
export type UpdateVocabDetailSectionPayload = z.infer<
 typeof updateVocabDetailSectionPayloadSchema
>;
export type UpdateGrammarCorePayload = z.infer<
 typeof updateGrammarCorePayloadSchema
>;
export type UpdateGrammarExamplePayload = z.infer<
 typeof updateGrammarExamplePayloadSchema
>;
export type UpdateGrammarDetailSectionPayload = z.infer<
 typeof updateGrammarDetailSectionPayloadSchema
>;
