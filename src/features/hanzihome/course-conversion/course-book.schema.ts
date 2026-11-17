import { z } from "zod";

import {
 courseBookKeySchema,
 textbookBookSchema,
 textbookLessonSchema,
} from "@/features/hanzihome/static-json/textbook-catalog";

export { courseBookKeySchema };

/** The textbook lesson/book contract narrowed to the converted course books. */
export const courseLessonSchema = textbookLessonSchema.extend({ bookKey: courseBookKeySchema });

export const courseBookSchema = textbookBookSchema.extend({
 key: courseBookKeySchema,
 lessons: z.array(courseLessonSchema).min(1),
});

export type CourseBook = z.output<typeof courseBookSchema>;
export type CourseLesson = CourseBook["lessons"][number];
export type CourseSection = CourseLesson["sections"][number];
export type CourseBlock = CourseSection["blocks"][number];
export type CourseVocabRow = CourseLesson["vocab"][number];
