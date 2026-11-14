import { z } from "zod";

export const REVIEW_LESSONS_QUERY_KEY = "reviewLessons";

export type ReviewLessonRouteOption = {
 id: string;
 lessonNumber: number;
 courseId?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
 bookId?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
 title?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
 titleZh?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
};

function inferBookToken(lesson: ReviewLessonRouteOption) {
 const source = [lesson.courseId, lesson.bookId, lesson.title, lesson.titleZh]
  .filter(Boolean)
  .join(" ")
  .toLowerCase();

 if (/\bq2\b|quyen[-_ ]?2|quyển\s*2|hanyu[-_ ]?q?2|book[-_ ]?2/.test(source)) {
  return "q2";
 }

 if (/\bq3\b|quyen[-_ ]?3|quyển\s*3|hanyu[-_ ]?q?3|book[-_ ]?3/.test(source)) {
  return "q3";
 }

 return "";
}

export function getReviewLessonToken(lesson: ReviewLessonRouteOption) {
 const bookToken = inferBookToken(lesson);

 if (!bookToken || !Number.isFinite(lesson.lessonNumber)) {
  return lesson.id;
 }

 return `${bookToken}-b${lesson.lessonNumber}`;
}

export function parseReviewLessonTokensParam(value: z.infer<z.ZodNullable<z.ZodString>>): string[] {
 if (!value) return [];

 return Array.from(
  new Set(
   value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  ),
 );
}

export function resolveReviewLessonTokens(tokens: string[], lessons: ReviewLessonRouteOption[]) {
 const byToken = new Map<string, string>();

 for (const lesson of lessons) {
  byToken.set(getReviewLessonToken(lesson), lesson.id);
  byToken.set(lesson.id, lesson.id); // Backward compatibility for old UUID URLs.
 }

 return tokens
  .map((token) => byToken.get(token))
  .filter((lessonId): lessonId is string => Boolean(lessonId));
}

export function buildReviewLessonsQueryFromLessons(lessons: ReviewLessonRouteOption[]) {
 const tokens = Array.from(new Set(lessons.map(getReviewLessonToken).filter(Boolean)));
 const params = new URLSearchParams();

 if (tokens.length > 0) {
  params.set(REVIEW_LESSONS_QUERY_KEY, tokens.join(","));
 }

 return params.toString();
}

export function buildVocabReviewHrefFromLessons(lessons: ReviewLessonRouteOption[]) {
 const queryString = buildReviewLessonsQueryFromLessons(lessons);

 return queryString ? `/vocab/review?${queryString}` : "/vocab/review";
}
