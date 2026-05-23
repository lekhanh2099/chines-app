import { z } from "zod";

export const hanziHomeCourseTypeSchema = z.enum([
  "hanyu",
  "hsk",
  "listening",
  "custom",
]);

export const hanziHomeCourseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  type: hanziHomeCourseTypeSchema,
  order: z.number(),
});

export const hanziHomeCourseBookSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  shortTitle: z.string().optional(),
  order: z.number(),
});

export const hanziHomeCourseCatalogResponseSchema = z.object({
  courses: z.array(hanziHomeCourseSchema),
  books: z.array(hanziHomeCourseBookSchema),
});

export const createHanziHomeCourseRequestSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tên course"),
  subtitle: z.string().trim().optional(),
  type: hanziHomeCourseTypeSchema.default("custom"),
  initialBookTitle: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên quyển/sách đầu tiên"),
  initialBookShortTitle: z.string().trim().optional(),
});

export type CreateHanziHomeCourseRequest = z.infer<
  typeof createHanziHomeCourseRequestSchema
>;
