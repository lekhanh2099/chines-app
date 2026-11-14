import "server-only";

import type { HanziHomeData } from "@/features/hanzihome/types";
import {
 getStaticStudioLessonDetail,
 listStaticStudioCourseLessons,
} from "@/features/hanzihome/static-json/studio-static-content";
import { isPublishedStudioGrammarCourseId } from "@/features/hanzihome/static-json/studio-published-content-id";

import { buildHanziHomeLessonSearchItems, buildHanziHomeSearchIndex } from "../buildSearchIndex";
import type { HanziHomeSearchIndexItem } from "../types";
import type { SearchDocument } from "./search-engine";

const STUDIO_GRAMMAR_COURSE_ID = "hanzihome-studio-grammar";

/** Course items carry their already-normalized search text (title, context and body). */
export function courseItemToSearchDocument(indexItem: HanziHomeSearchIndexItem): SearchDocument {
 const { searchText, ...item } = indexItem;
 return {
  item,
  title: item.title,
  pinyin: item.pinyin ?? "",
  subtitle: "",
  body: searchText,
 };
}

/**
 * Supabase course content as visible to the requesting user. The static
 * Studio grammar course replaces any Supabase copy, as the catalog does.
 */
export function collectSupabaseCourseDocuments(data: HanziHomeData) {
 return buildHanziHomeSearchIndex(data)
  .filter((item) => !isPublishedStudioGrammarCourseId(item.courseId ?? ""))
  .map(courseItemToSearchDocument);
}

/** The checked-in Studio grammar course, which the catalog serves from static content. */
export function collectStudioCourseDocuments() {
 const lessons = listStaticStudioCourseLessons(STUDIO_GRAMMAR_COURSE_ID).flatMap((summary) => {
  const lesson = getStaticStudioLessonDetail(summary.id);
  return lesson ? [lesson] : [];
 });
 return buildHanziHomeLessonSearchItems(lessons).map(courseItemToSearchDocument);
}
