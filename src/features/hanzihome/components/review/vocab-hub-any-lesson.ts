import type { BookmarkedTextbookGroup, StudyBundle } from "./vocab-hub-adapter";

/** Select values of the "any lesson" picker: `static:<lessonId>` of a library textbook. */
const STATIC_PREFIX = "static:";

export type AnyLessonOption = {
 readonly value: string;
 readonly lessonId: string;
 readonly label: string;
 readonly bookTitle: string;
};

export type AnyLessonGroup = {
 readonly key: string;
 readonly label: string;
 readonly lessons: readonly AnyLessonOption[];
};

/** Maps the static textbook summaries onto picker groups (one group per book). */
export function buildTextbookLessonGroups(
 groups: readonly BookmarkedTextbookGroup[],
): AnyLessonGroup[] {
 return groups.map((group) => ({
  key: `static:${group.bookKey}`,
  label: group.bookLabel,
  lessons: group.lessons.map((lesson) => ({
   value: `${STATIC_PREFIX}${lesson.id}`,
   lessonId: lesson.id,
   label: lesson.title,
   bookTitle: group.bookLabel,
  })),
 }));
}

export function findAnyLessonOption(groups: readonly AnyLessonGroup[], selection: string) {
 if (!selection) return undefined;
 for (const group of groups) {
  const option = group.lessons.find((lesson) => lesson.value === selection);
  if (option) return option;
 }
 return undefined;
}

/**
 * Decides what the "any lesson" source shows. A bundle is only shown when it was
 * built for the current selection, so a previous lesson's deck never appears under
 * a new lesson name while that lesson is loading or failed. An empty `status`
 * means the deck is ready to study.
 */
export function resolveAnyLessonDeck({
 selection,
 option,
 isSummaryLoading,
 isLoading,
 isError,
 bundle,
 emptyBundle,
 messages,
}: {
 selection: string;
 option?: AnyLessonOption;
 isSummaryLoading: boolean;
 isLoading: boolean;
 isError: boolean;
 bundle?: StudyBundle;
 emptyBundle: StudyBundle;
 messages: {
  placeholder: string;
  loading: string;
  error: string;
  missing: string;
  empty: string;
 };
}) {
 const blocked = (status: string, canRetry = false) => ({ bundle: emptyBundle, status, canRetry });
 if (!selection) return blocked(messages.placeholder);
 if (!option) return blocked(isSummaryLoading ? messages.loading : messages.missing);
 if (isError) return blocked(messages.error, true);
 if (isLoading || !bundle) return blocked(messages.loading);
 if (bundle.vocabItems.length === 0) return { bundle, status: messages.empty, canRetry: false };
 return { bundle, status: "", canRetry: false };
}
