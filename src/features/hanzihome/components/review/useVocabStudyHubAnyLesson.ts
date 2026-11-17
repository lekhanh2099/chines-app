"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { BookmarkedTextbookGroup, StudyBundle } from "./vocab-hub-adapter";
import {
 buildTextbookLessonGroups,
 findAnyLessonOption,
 resolveAnyLessonDeck,
} from "./vocab-hub-any-lesson";

const loadTextbookStudy = () => import("./vocab-hub-adapter");
const NO_TEXTBOOK_GROUPS: readonly BookmarkedTextbookGroup[] = [];

/**
 * Owns the PiP "any lesson" source: lesson summaries of the library textbooks for
 * the picker (only while this source is active), the picked lesson and its deck. Picking a lesson never bookmarks it or touches workspace resume state.
 */
export function useVocabStudyHubAnyLesson({ enabled }: { enabled: boolean }) {
 const t = useTranslations("BusinessChinese.vocabHub.anyLesson");
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
  () => buildTextbookLessonGroups(textbookGroupsData ?? NO_TEXTBOOK_GROUPS),
  [textbookGroupsData],
 );
 const option = useMemo(() => findAnyLessonOption(groups, selection), [groups, selection]);
 const staticLessonId = enabled && option ? option.lessonId : "";
 const staticEntry = useMemo(
  () =>
   (textbookGroupsData ?? NO_TEXTBOOK_GROUPS)
    .flatMap((group) => group.lessons)
    .find((lesson) => lesson.id === staticLessonId),
  [staticLessonId, textbookGroupsData],
 );

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

 const emptyBundle = useMemo<StudyBundle>(
  () => ({ title: t("source"), vocabItems: [], grammarItems: [], practiceItems: [] }),
  [t],
 );

 const isSummaryLoading = isTextbookGroupsLoading;
 const isSummaryError = isTextbookGroupsError;
 const deck = resolveAnyLessonDeck({
  selection,
  option,
  isSummaryLoading,
  isLoading: isStaticBundlePending,
  isError: isStaticBundleError,
  bundle: staticBundle,
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
  if (isTextbookGroupsError) void refetchTextbookGroups();
  if (option && isStaticBundleError) void refetchStaticBundle();
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
