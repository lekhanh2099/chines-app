import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { HanziHomeCatalogCourse } from "@/features/hanzihome/types";
import {
 buildLessonGrammarResource,
 buildLessonOverviewResource,
 buildLessonSectionsResource,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import { bookRowSchema, courseRowSchema } from "./supabase-content-row.schemas";
import { getAggregateItems, getSearchData } from "./supabase-hanzihome-aggregate-search";
import {
 getCatalogStatsRows,
 getLessonDetailRow,
 getLessonSectionRow,
 getLessonSummaryRows,
 getLessonVocabularyRows,
 getRadicalsFromDatabase,
 requireRows,
} from "./supabase-hanzihome-content-queries";
import {
 buildMeta,
 entityLessonId,
 lessonSectionRowToSection,
} from "./supabase-hanzihome-content-utils";
import {
 lessonDetailToViewModel,
 lessonSummaryToViewModel,
} from "./supabase-hanzihome-lesson-model";
import { vocabRowToViewModel } from "./supabase-hanzihome-vocab-model";

export const supabaseHanziHomeContentRepository = {
 async getCatalogSummary({ includeLessons = false, includeRadicals = false } = {}) {
  const client = await createClient();
  const [courseRows, bookRows, lessonRows, statsRows, radicals] = await Promise.all([
   requireRows(
    "catalog courses",
    client
     .from("hanzihome_courses")
     .select("id, slug, title, subtitle, type, course_order, updated_at")
     .is("deleted_at", null)
     .order("course_order"),
    z.array(courseRowSchema),
   ),
   requireRows(
    "catalog books",
    client
     .from("hanzihome_course_books")
     .select("id, course_id, title, short_title, book_order, updated_at")
     .is("deleted_at", null)
     .order("book_order"),
    z.array(bookRowSchema),
   ),
   includeLessons ? getLessonSummaryRows() : Promise.resolve([]),
   includeLessons ? Promise.resolve([]) : getCatalogStatsRows(),
   includeRadicals ? getRadicalsFromDatabase() : Promise.resolve([]),
  ]);
  const lessons = lessonRows.map(lessonSummaryToViewModel);
  const statsByCourse = new Map(statsRows.map((row) => [row.course_id, row]));
  const courses: HanziHomeCatalogCourse[] = courseRows.map((course) => {
   const courseLessons = lessons.filter((lesson) => lesson.courseId === course.id);
   const sortedLessons = courseLessons.slice().sort((left, right) => {
    return (left.lessonOrder ?? left.lessonNumber) - (right.lessonOrder ?? right.lessonNumber);
   });
   const stats = statsByCourse.get(course.id);

   return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle ?? undefined,
    type: course.type,
    order: course.course_order,
    updatedAt: course.updated_at,
    stats: {
     bookCount: stats?.book_count ?? bookRows.filter((book) => book.course_id === course.id).length,
     lessonCount: stats?.lesson_count ?? courseLessons.length,
     vocabCount:
      stats?.vocab_count ??
      courseLessons.reduce((sum, lesson) => sum + (lesson.vocabCount ?? 0), 0),
     grammarCount:
      stats?.grammar_count ??
      courseLessons.reduce((sum, lesson) => sum + (lesson.grammarCount ?? 0), 0),
    },
    lastLessonId: stats?.last_lesson_id ?? sortedLessons.at(-1)?.id,
    fallbackLessonId: stats?.fallback_lesson_id ?? sortedLessons[0]?.id,
   };
  });
  const catalogMeta = buildMeta(lessons, radicals);

  if (!includeLessons) {
   catalogMeta.counts.lessons = courses.reduce((sum, course) => sum + course.stats.lessonCount, 0);
   catalogMeta.counts.vocab = courses.reduce((sum, course) => sum + course.stats.vocabCount, 0);
   catalogMeta.counts.grammarPoints = courses.reduce(
    (sum, course) => sum + course.stats.grammarCount,
    0,
   );
  }

  return {
   source: "db",
   courses,
   books: bookRows.map((book) => ({
    id: book.id,
    courseId: book.course_id,
    title: book.title,
    shortTitle: book.short_title ?? undefined,
    order: book.book_order,
    updatedAt: book.updated_at,
   })),
   lessons: includeLessons ? lessons : [],
   radicals,
   meta: catalogMeta,
  };
 },

 async getCourseLessonSummaries(courseId: string) {
  return (await getLessonSummaryRows(courseId)).map(lessonSummaryToViewModel);
 },

 async getLessonOverview(lessonId: string) {
  const lesson = await this.getLessonDetail(lessonId);
  return lesson ? buildLessonOverviewResource(lesson) : null;
 },

 async getLessonDetail(lessonId: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>) {
  if (!lessonId) return null;
  const row = await getLessonDetailRow(lessonId);
  return row ? lessonDetailToViewModel(row) : null;
 },

 async getLessonSections(lessonId: string) {
  const lesson = await this.getLessonDetail(lessonId);
  return lesson ? buildLessonSectionsResource(lesson) : null;
 },

 async getLessonSection(sectionId: string) {
  const row = await getLessonSectionRow(sectionId);
  return row ? lessonSectionRowToSection(row) : null;
 },

 async getLessonVocabulary(lessonId: string) {
  if (!lessonId) return null;
  const rows = await getLessonVocabularyRows(lessonId);
  return {
   lessonId,
   items: rows.map(vocabRowToViewModel),
   total: rows.length,
  };
 },

 async getVocabDetail(vocabId: string) {
  const lessonId = entityLessonId(vocabId);
  if (!lessonId) return null;
  const rows = await getLessonVocabularyRows(lessonId);
  const dbId = vocabId.includes("__") ? vocabId.split("__").at(-1) : vocabId;
  const row = rows.find((item) => item.id === dbId);
  return row ? vocabRowToViewModel(row) : null;
 },

 async getLessonGrammar(lessonId: string) {
  const lesson = await this.getLessonDetail(lessonId);
  return lesson ? buildLessonGrammarResource(lesson) : null;
 },

 async getGrammarDetail(grammarId: string) {
  const lessonId = entityLessonId(grammarId);
  if (!lessonId) return null;
  const lesson = await this.getLessonDetail(lessonId);
  return lesson?.grammar.find((item) => item.id === grammarId) ?? null;
 },

 getAggregateItems,
 getSearchData,
};
