import { describe, expect, it } from "vitest";

import type { PracticeAttemptRow } from "@/features/hanzihome/reader/reader-state.schemas";
import { buildHomeRecentActivity, projectHomeReviewEvidence } from "./home-dashboard.utils";

function reviewAttempt(input: {
 id: string;
 itemType: "vocab" | "grammar" | "radical";
 itemId: string;
 result: "again" | "hard" | "known";
 label?: string;
 createdAt: string;
}): PracticeAttemptRow {
 return {
  id: input.id,
  user_id: "00000000-0000-4000-8000-000000000001",
  surface: "review",
  content_id: `${input.itemType}:${input.itemId}`,
  direction: null,
  answer: {
   kind: "review",
   itemType: input.itemType,
   result: input.result,
   ...(input.label ? { label: input.label } : {}),
  },
  score: null,
  response_ms: null,
  created_at: input.createdAt,
 };
}

describe("buildHomeRecentActivity", () => {
 it("uses the immutable review attempt label without loading lesson content", () => {
  const attempts = [
   reviewAttempt({
    id: "00000000-0000-4000-8000-000000000002",
    itemType: "grammar",
    itemId: "lesson-1__grammar-1",
    label: "只有……才……",
    result: "hard",
    createdAt: "2026-08-17T02:00:00.000Z",
   }),
   reviewAttempt({
    id: "00000000-0000-4000-8000-000000000003",
    itemType: "vocab",
    itemId: "lesson-1__word-1",
    label: "坚持",
    result: "known",
    createdAt: "2026-08-17T01:00:00.000Z",
   }),
  ];

  expect(buildHomeRecentActivity(attempts).map((item) => item.label)).toEqual([
   "只有……才……",
   "坚持",
  ]);
 });

 it("keeps backfilled review attempts readable when no label exists", () => {
  const attempts = [
   reviewAttempt({
    id: "00000000-0000-4000-8000-000000000004",
    itemType: "radical",
    itemId: "legacy-radical",
    result: "known",
    createdAt: "2026-08-17T03:00:00.000Z",
   }),
   reviewAttempt({
    id: "00000000-0000-4000-8000-000000000005",
    itemType: "grammar",
    itemId: "legacy-grammar",
    result: "hard",
    createdAt: "2026-08-17T02:00:00.000Z",
   }),
   reviewAttempt({
    id: "00000000-0000-4000-8000-000000000006",
    itemType: "vocab",
    itemId: "legacy-vocab",
    result: "again",
    createdAt: "2026-08-17T01:00:00.000Z",
   }),
  ];

  expect(buildHomeRecentActivity(attempts).map((item) => item.label)).toEqual([
   "Bộ thủ đã ôn",
   "Điểm ngữ pháp đã ôn",
   "Từ vựng đã ôn",
  ]);
 });

 it("returns only the four newest attempt rows supplied by the bounded query", () => {
  const attempts = Array.from({ length: 6 }, (_, index) =>
   reviewAttempt({
    id: `00000000-0000-4000-8000-0000000000${index + 10}`,
    itemType: "vocab",
    itemId: `vocab-${index}`,
    label: `Từ ${index}`,
    result: "known",
    createdAt: `2026-08-17T0${5 - index}:00:00.000Z`,
   }),
  );

  expect(buildHomeRecentActivity(attempts).map((item) => item.label)).toEqual([
   "Từ 0",
   "Từ 1",
   "Từ 2",
   "Từ 3",
  ]);
 });

 it("ignores non-review and malformed evidence rather than inventing activity", () => {
  const valid = reviewAttempt({
   id: "00000000-0000-4000-8000-000000000020",
   itemType: "vocab",
   itemId: "word",
   result: "known",
   createdAt: "2026-08-17T01:00:00.000Z",
  });
  const nonReview: PracticeAttemptRow = { ...valid, surface: "translation" };
  const malformed: PracticeAttemptRow = { ...valid, id: "bad", answer: { kind: "review" } };

  expect(projectHomeReviewEvidence([nonReview, malformed, valid])).toHaveLength(1);
 });
});
