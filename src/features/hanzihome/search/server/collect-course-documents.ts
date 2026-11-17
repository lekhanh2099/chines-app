import "server-only";

import type { StaticRadicalData } from "@/features/hanzihome/types";
import {
 getStaticStudioLessonDetail,
 listStaticStudioCourseLessons,
} from "@/features/hanzihome/static-json/studio-static-content";

import {
 buildHanziHomeLessonSearchItems,
 buildHanziHomeNavigationSearchItems,
 buildHanziHomeRadicalSearchItems,
} from "../buildSearchIndex";
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

/** Radicals as stored in the database; they are shared seed content, not owned by a user. */
export function collectRadicalDocuments(radicals: readonly StaticRadicalData[]) {
 return buildHanziHomeRadicalSearchItems(radicals).map(courseItemToSearchDocument);
}

/** Shortcuts to the main surfaces. */
export function collectNavigationDocuments() {
 return buildHanziHomeNavigationSearchItems().map(courseItemToSearchDocument);
}

/** The checked-in Studio grammar course, which the catalog serves from static content. */
export function collectStudioCourseDocuments() {
 const lessons = listStaticStudioCourseLessons(STUDIO_GRAMMAR_COURSE_ID).flatMap((summary) => {
  const lesson = getStaticStudioLessonDetail(summary.id);
  return lesson ? [lesson] : [];
 });
 return buildHanziHomeLessonSearchItems(lessons).map(courseItemToSearchDocument);
}
