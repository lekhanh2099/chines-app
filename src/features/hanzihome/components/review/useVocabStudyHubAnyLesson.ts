"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeLesson } from "@/features/hanzihome/hooks/useHanziHomeLesson";
import { getErrorHttpStatus } from "@/features/hanzihome/local/lesson-content-cache";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { BookmarkedTextbookGroup, StudyBundle } from "./vocab-hub-adapter";
import {
 buildCatalogLessonBundle,
 buildCatalogLessonGroups,
 buildTextbookLessonGroups,
 findAnyLessonOption,
 resolveAnyLessonDeck,
} from "./vocab-hub-any-lesson";

const loadTextbookStudy = () => import("./vocab-hub-adapter");
const NO_TEXTBOOK_GROUPS: readonly BookmarkedTextbookGroup[] = [];

/**
 * Owns the PiP "any lesson" source: lesson summaries for the picker (catalog +
 * library textbooks, only while this source is active), the picked lesson and its
 * deck. Picking a lesson never bookmarks it or touches workspace resume state.
 */
export function useVocabStudyHubAnyLesson({ enabled }: { enabled: boolean }) {
 const t = useTranslations("BusinessChinese.vocabHub.anyLesson");
 const {
  data: catalogData,
  isLoading: isCatalogLoading,
  isError: isCatalogError,
  refetch: refetchCatalog,
 } = useHanziHomeCatalogQuery({ includeLessons: true, enabled });
 const {
  data: textbookGroupsData,
  isLoading: isTextbookGroupsLoading,
  isError: isTextbookGroupsError,
  refetch: refetchTextbookGroups,
 } = useQuery({
  queryKey: hanzihomeQueryKeys.selectableTextbookGroups,
  queryFn: async () => (await loadTextbookStudy()).getSelectableTextbookGroups(),
  enabled,
  staleTime: Number.POSITIVE_INFINITY,
 });
 const [selection, setSelection] = useState("");

 const groups = useMemo(
  () => [
   ...buildCatalogLessonGroups(catalogData, {
    group: (course, book) => t("groupLabel", { course, book }),
    lesson: (number, title) => t("lessonOption", { number, title }),
   }),
   ...buildTextbookLessonGroups(textbookGroupsData ?? NO_TEXTBOOK_GROUPS),
  ],
  [catalogData, t, textbookGroupsData],
 );
 const option = useMemo(() => findAnyLessonOption(groups, selection), [groups, selection]);
 const isCatalogPick = option?.isCatalog === true;
 const catalogLessonId = enabled && option && option.isCatalog ? option.lessonId : "";
 const staticLessonId = enabled && option && !option.isCatalog ? option.lessonId : "";
 const staticEntry = useMemo(
  () =>
   (textbookGroupsData ?? NO_TEXTBOOK_GROUPS)
    .flatMap((group) => group.lessons)
    .find((lesson) => lesson.id === staticLessonId),
  [staticLessonId, textbookGroupsData],
 );

 // Loads only the picked lesson through the shared lesson detail/vocabulary keys.
 const {
  lesson: catalogLesson,
  isLoading: isCatalogLessonLoading,
  isError: isCatalogLessonError,
  error: catalogLessonError,
  refetch: refetchCatalogLesson,
 } = useHanziHomeLesson(catalogLessonId || null);
 // Same key and data as a single bookmarked lesson's deck; no placeholder data,
 // so a new pick never shows the previous lesson's deck while loading.
 const {
  data: staticBundle,
  isPending: isStaticBundlePending,
  isError: isStaticBundleError,
  refetch: refetchStaticBundle,
 } = useQuery({
  queryKey: hanzihomeQueryKeys.bookmarkedTextbookBundle(staticEntry ? [staticEntry.id] : []),
  queryFn: async () =>
   (await loadTextbookStudy()).buildStudyBundleFromBookmarkedLessons(
    staticEntry ? [staticEntry] : [],
   ),
  enabled: Boolean(staticEntry),
  staleTime: Number.POSITIVE_INFINITY,
 });

 const catalogBundle = useMemo(
  () =>
   option && catalogLesson && catalogLesson.id === catalogLessonId
    ? buildCatalogLessonBundle(
       catalogLesson,
       t("bundleTitle", { book: option.bookTitle, lesson: option.label }),
      )
    : undefined,
  [catalogLesson, catalogLessonId, option, t],
 );
 const emptyBundle = useMemo<StudyBundle>(
  () => ({ title: t("source"), vocabItems: [], grammarItems: [], practiceItems: [] }),
  [t],
 );

 const isSummaryLoading = isCatalogLoading || isTextbookGroupsLoading;
 const isSummaryError = isCatalogError || isTextbookGroupsError;
 const deck = resolveAnyLessonDeck({
  selection,
  option,
  isSummaryLoading,
  isLoading: isCatalogPick ? isCatalogLessonLoading : isStaticBundlePending,
  isError: isCatalogPick ? isCatalogLessonError : isStaticBundleError,
  // A catalog lesson removed after the summaries loaded answers 404.
  isMissing: isCatalogPick && getErrorHttpStatus(catalogLessonError) === 404,
  bundle: isCatalogPick ? catalogBundle : staticBundle,
  emptyBundle,
  messages: {
   placeholder: t("placeholder"),
   loading: t("loading"),
   error: t("error"),
   missing: t("missing"),
   empty: t("empty"),
  },
 });

 const retry = () => {
  if (isCatalogError) void refetchCatalog();
  if (isTextbookGroupsError) void refetchTextbookGroups();
  if (isCatalogPick && isCatalogLessonError) void refetchCatalogLesson();
  if (option && !isCatalogPick && isStaticBundleError) void refetchStaticBundle();
 };

 return {
  groups,
  selection,
  setSelection,
  selectedLabel: option?.label ?? "",
  isSummaryLoading,
  isSummaryError,
  bundle: deck.bundle,
  status: deck.status,
  canRetry: deck.canRetry || isSummaryError,
  retry,
 };
}
