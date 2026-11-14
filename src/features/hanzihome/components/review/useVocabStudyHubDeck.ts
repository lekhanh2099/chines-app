"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { getItWebVocabCorpus } from "@/features/hanzihome/static-json/it-web-vocab-static-content";
import { useVocabStudyHubAnyLesson } from "./useVocabStudyHubAnyLesson";
import type { BookmarkedTextbookGroup, StudyBundle } from "./vocab-hub-adapter";
import {
 buildCustomVaultBundle,
 buildItQuickBundle,
 selectBookmarkedLessons,
 type HubSourceMode,
} from "./vocab-hub-model";

// The textbook corpus (~4 MB) is only needed for bookmarked lessons, so it is
// loaded on demand instead of being bundled into every route that shows the hub.
const loadTextbookStudy = () => import("./vocab-hub-adapter");
const NO_BOOKMARKED_GROUPS: readonly BookmarkedTextbookGroup[] = [];
const EMPTY_BOOKMARKED_BUNDLE: StudyBundle = {
 title: "Bài đã đánh dấu",
 vocabItems: [],
 grammarItems: [],
 practiceItems: [],
};

/** Owns the hub's deck: source selection, bookmarked/IT/any-lesson scope and the active bundle. */
export function useVocabStudyHubDeck({ defaultSource }: { defaultSource: HubSourceMode }) {
 const learning = useLearningState();
 const bookmarkedLessonIds = useMemo(
  () => learning.state.bookmarks.lessons ?? [],
  [learning.state.bookmarks.lessons],
 );
 const customVocabItems = useMemo(
  () => learning.state.settings.customVocab ?? [],
  [learning.state.settings.customVocab],
 );

 const bookmarkedGroupsQuery = useQuery({
  queryKey: hanzihomeQueryKeys.bookmarkedTextbookGroups(bookmarkedLessonIds),
  queryFn: async () => (await loadTextbookStudy()).getBookmarkedTextbookGroups(bookmarkedLessonIds),
  enabled: bookmarkedLessonIds.length > 0,
  staleTime: Number.POSITIVE_INFINITY,
  // Keep the previous deck while a new selection loads instead of flashing empty.
  placeholderData: keepPreviousData,
 });
 const bookmarkedGroups =
  bookmarkedLessonIds.length > 0
   ? (bookmarkedGroupsQuery.data ?? NO_BOOKMARKED_GROUPS)
   : NO_BOOKMARKED_GROUPS;
 const allBookmarkedLessons = useMemo(
  () => bookmarkedGroups.flatMap((g) => g.lessons),
  [bookmarkedGroups],
 );
 const totalBookmarkedLessons = allBookmarkedLessons.length;
 const allBookmarkedVocabCount = useMemo(
  () => allBookmarkedLessons.reduce((sum, l) => sum + l.vocabCount, 0),
  [allBookmarkedLessons],
 );

 // Derive active source mode dynamically when the user hasn't explicitly picked one yet,
 // so hydrated bookmarked lessons automatically activate "bookmarked-lessons".
 const [userSelectedSource, setUserSelectedSource] = useState<HubSourceMode | null>(null);
 const sourceMode: HubSourceMode = useMemo(() => {
  if (userSelectedSource) return userSelectedSource;
  if (defaultSource === "bookmarked-lessons") {
   return totalBookmarkedLessons > 0 ? "bookmarked-lessons" : "it-quick";
  }
  return defaultSource;
 }, [defaultSource, totalBookmarkedLessons, userSelectedSource]);

 // IT Quick State (single selector value: "preset:<key>" or "group:<id>")
 const itCorpus = useMemo(() => getItWebVocabCorpus(), []);
 const [itSelection, setItSelection] = useState<string>("preset:core20");

 // Bookmarked Textbook Scope State ("all" | "book:<bookKey>" | "lesson:<lessonId>")
 const [bookmarkedSelection, setBookmarkedSelection] = useState<string>("all");

 const selectedBookmarkedLessons = useMemo(
  () => selectBookmarkedLessons(bookmarkedSelection, bookmarkedGroups, allBookmarkedLessons),
  [allBookmarkedLessons, bookmarkedGroups, bookmarkedSelection],
 );

 const bookmarkedBundleQuery = useQuery({
  queryKey: hanzihomeQueryKeys.bookmarkedTextbookBundle(
   selectedBookmarkedLessons.map((lesson) => lesson.id),
  ),
  queryFn: async () =>
   (await loadTextbookStudy()).buildStudyBundleFromBookmarkedLessons(selectedBookmarkedLessons),
  enabled: sourceMode === "bookmarked-lessons" && selectedBookmarkedLessons.length > 0,
  staleTime: Number.POSITIVE_INFINITY,
  // Keep the previous deck while a new selection loads instead of flashing empty.
  placeholderData: keepPreviousData,
 });
 const bookmarkedBundle =
  selectedBookmarkedLessons.length > 0 ? bookmarkedBundleQuery.data : EMPTY_BOOKMARKED_BUNDLE;

 const anyLesson = useVocabStudyHubAnyLesson({ enabled: sourceMode === "lessons" });
 const anyLessonBundle = anyLesson.bundle;

 const activeBundle = useMemo<StudyBundle>(() => {
  if (sourceMode === "lessons") {
   return anyLessonBundle;
  }

  if (sourceMode === "it-quick") {
   return buildItQuickBundle(itSelection, itCorpus);
  }

  if (sourceMode === "bookmarked-lessons") {
   return bookmarkedBundle ?? EMPTY_BOOKMARKED_BUNDLE;
  }

  return buildCustomVaultBundle(customVocabItems);
 }, [anyLessonBundle, bookmarkedBundle, customVocabItems, itCorpus, itSelection, sourceMode]);

 return {
  learning,
  customVocabItems,
  bookmarkedGroups,
  totalBookmarkedLessons,
  allBookmarkedVocabCount,
  sourceMode,
  setUserSelectedSource,
  itCorpus,
  itSelection,
  setItSelection,
  bookmarkedSelection,
  setBookmarkedSelection,
  anyLesson,
  activeBundle,
 };
}
