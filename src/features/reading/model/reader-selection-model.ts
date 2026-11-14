import type { CSSProperties } from "react";

import type { upsertLearningLoopItem } from "@/features/hanzihome/learning-loop/learning-loop-api";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";

type LearningLoopItemInput = Parameters<typeof upsertLearningLoopItem>[0];

export type ReaderSelectionMode = "quick" | "note" | "more";
export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export const HIGHLIGHT_COLORS: ReadonlyArray<{
 color: HighlightColor;
 label: string;
 swatchStyle: CSSProperties;
}> = [
 {
  color: "yellow",
  label: "Vàng",
  swatchStyle: { backgroundColor: "var(--color-warning)" },
 },
 {
  color: "green",
  label: "Xanh lá",
  swatchStyle: { backgroundColor: "var(--color-success)" },
 },
 {
  color: "blue",
  label: "Xanh biển",
  swatchStyle: { backgroundColor: "var(--color-info)" },
 },
 {
  color: "pink",
  label: "Hồng",
  swatchStyle: { backgroundColor: "var(--color-purple)" },
 },
];

/** Replaces the item with the same id, or appends it when it is new. */
export function upsertById<T extends { id: string }>(items: readonly T[], item: T): T[] {
 const exists = items.some((current) => current.id === item.id);
 return exists
  ? items.map((current) => (current.id === item.id ? item : current))
  : [...items, item];
}

/** Drops the item with the given id. */
export function removeById<T extends { id: string }>(items: readonly T[], id: string): T[] {
 return items.filter((item) => item.id !== id);
}

/** A fresh learning-loop review item for text selected in a Reader document. */
export function buildReaderSelectionLoopItem({
 stableKey,
 kind,
 documentModel,
 sourceHref,
 promptZh,
 pinyin,
 meaningVi,
 now,
}: {
 stableKey: string;
 kind: LearningLoopItemInput["kind"];
 documentModel: ReaderDocumentModel;
 sourceHref: string;
 promptZh: string;
 pinyin: string;
 meaningVi: string;
 now: string;
}): LearningLoopItemInput {
 return {
  id: stableKey,
  stable_key: stableKey,
  kind,
  source_id: documentModel.id,
  source_href: sourceHref,
  title_zh: documentModel.title ?? "",
  title_vi: documentModel.titleVi ?? "",
  prompt_zh: promptZh,
  pinyin,
  meaning_vi: meaningVi,
  user_answer: "",
  error_key: "",
  state: "new",
  due_at: now,
  interval_days: 0,
  correct_streak: 0,
  lapse_count: 0,
  revision: 0,
 };
}
