import { z } from "zod";

import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";

export const lessonDraftMetadataFormSchema = z.object({
  lessonNumber: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập số bài")
    .refine((value) => {
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue > 0;
    }, "Số bài phải là số nguyên dương"),
  titleZh: z.string().trim().min(1, "Vui lòng nhập tên bài tiếng Trung"),
  titleVi: z.string().trim(),
});

export type LessonDraftMetadataFormValues = z.infer<
  typeof lessonDraftMetadataFormSchema
>;

export function toLessonDraftMetadataFormValues(
  draft: LessonDraft,
): LessonDraftMetadataFormValues {
  return {
    lessonNumber: draft.lessonNumber ? String(draft.lessonNumber) : "",
    titleZh: draft.titleZh,
    titleVi: draft.titleVi ?? "",
  };
}
