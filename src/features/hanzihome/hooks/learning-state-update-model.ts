import type {
 CustomVocabItem,
 LearningStatus,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";
import type { ReviewAttemptInput } from "@/features/hanzihome/local/review-attempt-outbox";
import { nextProgress } from "@/features/hanzihome/utils/learning-state";

export type ReviewItem = Pick<UserLearningState["reviewHistory"][number], "type" | "id" | "label">;

export function reviewResultToLearningStatus(result: ReviewResult): LearningStatus {
 if (result === "known") return "known";
 if (result === "hard") return "hard";
 return "learning";
}

export function reviewAttemptInput(item: ReviewItem, result: ReviewResult): ReviewAttemptInput {
 return {
  itemType: item.type,
  itemId: item.id,
  label: item.label,
  result,
 };
}

export function applyReviewProgress(
 current: UserLearningState,
 item: ReviewItem,
 status: LearningStatus,
): UserLearningState {
 return {
  ...current,
  progress:
   item.type === "vocab"
    ? {
       ...current.progress,
       vocab: { ...current.progress.vocab, [item.id]: nextProgress(status) },
      }
    : {
       ...current.progress,
       grammar: { ...current.progress.grammar, [item.id]: nextProgress(status) },
      },
 };
}

export function applySettingsUpdate(
 current: UserLearningState,
 settings: Partial<UserLearningState["settings"]>,
): UserLearningState {
 return {
  ...current,
  settings: {
   ...current.settings,
   ...settings,
   ...(settings.bookDisplayModes
    ? {
       bookDisplayModes: { ...current.settings.bookDisplayModes, ...settings.bookDisplayModes },
      }
    : {}),
   ...(settings.bookResume
    ? { bookResume: { ...current.settings.bookResume, ...settings.bookResume } }
    : {}),
   ...(settings.bookLastStudiedAt
    ? {
       bookLastStudiedAt: {
        ...current.settings.bookLastStudiedAt,
        ...settings.bookLastStudiedAt,
       },
      }
    : {}),
  },
 };
}

export function applyVocabProgress(
 current: UserLearningState,
 id: string,
 status: LearningStatus,
): UserLearningState {
 return {
  ...current,
  progress: {
   ...current.progress,
   vocab: { ...current.progress.vocab, [id]: nextProgress(status) },
  },
 };
}

export function applyGrammarProgress(
 current: UserLearningState,
 id: string,
 status: LearningStatus,
): UserLearningState {
 return {
  ...current,
  progress: {
   ...current.progress,
   grammar: { ...current.progress.grammar, [id]: nextProgress(status) },
  },
 };
}

export function applyBookmarkToggle(
 current: UserLearningState,
 scope: keyof UserLearningState["bookmarks"],
 id: string,
): UserLearningState {
 const existing = current.bookmarks[scope] || [];
 const nextItems = existing.includes(id)
  ? existing.filter((item) => item !== id)
  : [...existing, id];

 return {
  ...current,
  bookmarks: { ...current.bookmarks, [scope]: nextItems },
 };
}

export function applyCustomVocabAdd(
 current: UserLearningState,
 items: readonly Omit<CustomVocabItem, "id" | "createdAt">[],
): UserLearningState {
 const existing = current.settings.customVocab ?? [];
 const nextMap = new Map(existing.map((item) => [item.hanzi.trim(), item]));
 const now = new Date().toISOString();

 items.forEach((raw, idx) => {
  const hanzi = raw.hanzi.trim();
  const meaning = raw.meaning.trim();
  if (!hanzi || !meaning) return;
  const prev = nextMap.get(hanzi);
  nextMap.set(hanzi, {
   id: prev?.id ?? `custom-vocab-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
   hanzi,
   pinyin: raw.pinyin.trim() || prev?.pinyin || "",
   meaning,
   pos: raw.pos?.trim() || prev?.pos,
   note: raw.note?.trim() || prev?.note,
   exampleZh: raw.exampleZh?.trim() || prev?.exampleZh,
   exampleVi: raw.exampleVi?.trim() || prev?.exampleVi,
   createdAt: prev?.createdAt ?? now,
  });
 });

 return {
  ...current,
  settings: {
   ...current.settings,
   customVocab: Array.from(nextMap.values()),
  },
 };
}

export function applyCustomVocabUpdate(
 current: UserLearningState,
 id: string,
 patch: Partial<Omit<CustomVocabItem, "id" | "createdAt">>,
): UserLearningState {
 const existing = current.settings.customVocab ?? [];
 const nextItems = existing.map((item) => {
  if (item.id !== id) return item;
  const nextHanzi = patch.hanzi !== undefined ? patch.hanzi.trim() : item.hanzi;
  const nextMeaning = patch.meaning !== undefined ? patch.meaning.trim() : item.meaning;
  return {
   ...item,
   hanzi: nextHanzi || item.hanzi,
   pinyin: patch.pinyin !== undefined ? patch.pinyin.trim() : item.pinyin,
   meaning: nextMeaning || item.meaning,
   pos: patch.pos !== undefined ? patch.pos.trim() || undefined : item.pos,
   note: patch.note !== undefined ? patch.note.trim() || undefined : item.note,
   exampleZh: patch.exampleZh !== undefined ? patch.exampleZh.trim() || undefined : item.exampleZh,
   exampleVi: patch.exampleVi !== undefined ? patch.exampleVi.trim() || undefined : item.exampleVi,
  };
 });

 return {
  ...current,
  settings: {
   ...current.settings,
   customVocab: nextItems,
  },
 };
}

export function applyCustomVocabRemove(current: UserLearningState, id: string): UserLearningState {
 const existing = current.settings.customVocab ?? [];
 return {
  ...current,
  settings: {
   ...current.settings,
   customVocab: existing.filter((item) => item.id !== id),
  },
 };
}

export function applyCustomVocabToggleByHanzi(
 current: UserLearningState,
 item: Omit<CustomVocabItem, "id" | "createdAt">,
): UserLearningState {
 const existing = current.settings.customVocab ?? [];
 const targetHanzi = item.hanzi.trim();
 if (!targetHanzi) return current;
 const exists = existing.some((entry) => entry.hanzi.trim() === targetHanzi);
 const nextCustomVocab = exists
  ? existing.filter((entry) => entry.hanzi.trim() !== targetHanzi)
  : [
     ...existing,
     {
      id: `custom-vocab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      hanzi: targetHanzi,
      pinyin: item.pinyin.trim(),
      meaning: item.meaning.trim() || targetHanzi,
      pos: item.pos?.trim() || undefined,
      note: item.note?.trim() || undefined,
      exampleZh: item.exampleZh?.trim() || undefined,
      exampleVi: item.exampleVi?.trim() || undefined,
      createdAt: new Date().toISOString(),
     },
    ];
 return {
  ...current,
  settings: {
   ...current.settings,
   customVocab: nextCustomVocab,
  },
 };
}
