"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { getHanziHomeData } from "@/features/hanzihome/static-data";
import type { HanziHomeData } from "@/features/hanzihome/types";

const vocabExampleSchema = z.object({
  zh: z.string(),
  pinyin: z.string().optional(),
  vi: z.string().optional(),
  note: z.string().optional(),
});

const vocabDetailSectionSchema = z.object({
  key: z.string(),
  title: z.string(),
  lines: z.array(z.string()),
});

const vocabViewModelSchema = z.object({
  id: z.string(),
  lessonId: z.string().optional(),
  word: z.string(),
  pinyin: z.string(),
  hanViet: z.string(),
  meaning: z.string(),
  category: z.string(),
  level: z.string().optional(),
  pos: z
    .object({
      vi: z.string().optional(),
      zh: z.string().optional(),
    })
    .optional(),
  examplesParsed: z.array(vocabExampleSchema),
  detailSections: z.array(vocabDetailSectionSchema),
});

const grammarViewModelSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  contentMd: z.string().optional(),
  cleanTitle: z.string(),
  core: z.string(),
  structuresView: z.array(z.string()),
  examplesParsed: z.array(vocabExampleSchema),
  notes: z.array(z.string()),
});

const lessonNotesSchema = z.object({
  overviewMarkdown: z.string().optional(),
  grammarSummary: z.string().optional(),
  vocabularyText: z.string().optional(),
  properNounsText: z.string().optional(),
  applicationMarkdown: z.string().optional(),
  personalNote: z.string().optional(),
});

const courseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  type: z.string(),
  order: z.number(),
});

const bookSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  shortTitle: z.string().optional(),
  order: z.number(),
});

const lessonSchema = z.object({
  id: z.string(),
  lessonNumber: z.number(),
  titleZh: z.string(),
  title: z.string(),
  sourceFile: z.string().optional(),
  courseId: z.string().optional(),
  courseTitle: z.string().optional(),
  bookId: z.string().optional(),
  bookTitle: z.string().optional(),
  bookOrder: z.number().optional(),
  lessonOrder: z.number().optional(),
  vocabCategories: z
    .array(
      z.object({
        nameVi: z.string(),
        words: z.array(z.string()),
      }),
    )
    .optional(),
  vocabCount: z.number().optional(),
  vocabIds: z.array(z.string()),
  grammarPointIds: z.array(z.string()),
  vocab: z.array(vocabViewModelSchema),
  grammar: z.array(grammarViewModelSchema),
  isDraft: z.boolean().optional(),
  draftId: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  notes: lessonNotesSchema.optional(),
});

const dbDataResponseSchema = z.object({
  source: z.enum(["db", "empty"]),
  hasSeededLessons: z.boolean(),
  data: z.object({
    courses: z.array(courseSchema),
    books: z.array(bookSchema),
    lessons: z.array(lessonSchema),
  }),
});

async function fetchDbHanziHomeData(
  staticData: HanziHomeData,
): Promise<HanziHomeData> {
  const response = await fetch("/api/hanzihome/data", {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Could not load DB-backed HanziHome data");
  }

  const json: unknown = await response.json();
  const parsed = dbDataResponseSchema.parse(json);

  return {
    ...parsed.data,
    radicals: staticData.radicals,
    meta: staticData.meta,
  };
}

export function useHanziHomeData() {
  const staticData = useMemo(() => getHanziHomeData(), []);
  const query = useQuery({
    queryKey: ["hanzihome", "data"],
    queryFn: () => fetchDbHanziHomeData(staticData),
    placeholderData: staticData,
    staleTime: 0,
  });

  return query.data && query.data.lessons.length > 0 ? query.data : staticData;
}
