import {
 getItWebVocabItemsByFilter,
 type ItWebQuickPreset,
 type ItWebVocabCorpus,
} from "@/features/hanzihome/static-json/it-web-vocab-static-content";
import type { BookmarkedTextbookGroup, StudyBundle } from "./vocab-hub-adapter";
import {
 buildExercisesFromVocabItems,
 customVocabListToHanziHomeVocabItems,
} from "./vocab-hub-custom";

export type HubSourceMode = "it-quick" | "bookmarked-lessons" | "custom-vault";

export const IT_PRESET_ITEMS: readonly { key: ItWebQuickPreset; label: string }[] = [
 { key: "core20", label: "20 từ cốt lõi ngày đầu" },
 { key: "all", label: "Tất cả IT (~270 từ)" },
 { key: "band-1-3", label: "Nhóm 1–3 (Giao tiếp & Tiến độ)" },
 { key: "band-4-6", label: "Nhóm 4–6 (UI/FE/BE & Debug)" },
 { key: "band-7-9", label: "Nhóm 7–9 (Vận hành & Cụm câu)" },
];

export function parseSourceMode(value: string): HubSourceMode {
 if (value === "bookmarked-lessons" || value === "it-quick" || value === "custom-vault") {
  return value;
 }
 return "bookmarked-lessons";
}

/** Resolves the bookmarked scope selector value ("all" | "book:<bookKey>" | "lesson:<lessonId>"). */
export function selectBookmarkedLessons(
 bookmarkedSelection: string,
 bookmarkedGroups: readonly BookmarkedTextbookGroup[],
 allBookmarkedLessons: BookmarkedTextbookGroup["lessons"],
): BookmarkedTextbookGroup["lessons"] {
 if (bookmarkedSelection === "all") return allBookmarkedLessons;
 if (bookmarkedSelection.startsWith("book:")) {
  const bookKey = bookmarkedSelection.slice("book:".length);
  const matchedGroup = bookmarkedGroups.find((g) => g.bookKey === bookKey);
  return matchedGroup ? matchedGroup.lessons : allBookmarkedLessons;
 }
 if (bookmarkedSelection.startsWith("lesson:")) {
  const lessonId = bookmarkedSelection.slice("lesson:".length);
  const matchedLesson = allBookmarkedLessons.find((l) => l.id === lessonId);
  return matchedLesson ? [matchedLesson] : allBookmarkedLessons;
 }
 return allBookmarkedLessons;
}

/** Builds the IT quick-study deck from the selector value ("preset:<key>" or "group:<id>"). */
export function buildItQuickBundle(itSelection: string, itCorpus: ItWebVocabCorpus): StudyBundle {
 const isGroup = itSelection.startsWith("group:");
 const rawKey = itSelection.replace(/^(preset|group):/u, "");
 const presetKey: ItWebQuickPreset =
  !isGroup &&
  (rawKey === "core20" ||
   rawKey === "all" ||
   rawKey === "band-1-3" ||
   rawKey === "band-4-6" ||
   rawKey === "band-7-9")
   ? rawKey
   : "core20";

 const vocabItems = getItWebVocabItemsByFilter({
  preset: isGroup ? "all" : presetKey,
  groupIds: isGroup ? [rawKey] : undefined,
 });
 const practiceItems = buildExercisesFromVocabItems(vocabItems);
 const groupLabel = isGroup
  ? (itCorpus.groups.find((g) => g.id === rawKey)?.label ?? "Từ vựng IT")
  : (IT_PRESET_ITEMS.find((p) => p.key === presetKey)?.label ?? "Từ vựng IT");

 return {
  title: `IT / Làm Web · ${groupLabel}`,
  vocabItems,
  grammarItems: [],
  practiceItems,
 };
}

/** Builds the learner's private-vault deck. */
export function buildCustomVaultBundle(
 customVocabItems: Parameters<typeof customVocabListToHanziHomeVocabItems>[0],
): StudyBundle {
 const vocabItems = customVocabListToHanziHomeVocabItems(customVocabItems);
 const practiceItems = buildExercisesFromVocabItems(vocabItems);
 return {
  title: "Kho từ vựng riêng",
  vocabItems,
  grammarItems: [],
  practiceItems,
 };
}
