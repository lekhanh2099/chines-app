import { describe, expect, it } from "vitest";

import type { UserLearningState } from "@/features/hanzihome/types";
import { buildHomeRecentActivity } from "./home-dashboard.utils";

describe("buildHomeRecentActivity", () => {
 it("uses the persisted review label instead of reloading full lesson content", () => {
  const history: UserLearningState["reviewHistory"] = [
   {
    type: "vocab",
    id: "lesson-1__word-1",
    label: "坚持",
    result: "known",
    answeredAt: "2026-08-17T01:00:00.000Z",
   },
   {
    type: "grammar",
    id: "lesson-1__grammar-1",
    label: "只有……才……",
    result: "hard",
    answeredAt: "2026-08-17T02:00:00.000Z",
   },
  ];

  expect(buildHomeRecentActivity(history).map((item) => item.label)).toEqual([
   "只有……才……",
   "坚持",
  ]);
 });

 it("keeps legacy review events readable when no label was persisted", () => {
  const history: UserLearningState["reviewHistory"] = [
   {
    type: "vocab",
    id: "legacy-vocab",
    result: "again",
    answeredAt: "2026-08-17T01:00:00.000Z",
   },
   {
    type: "grammar",
    id: "legacy-grammar",
    result: "hard",
    answeredAt: "2026-08-17T02:00:00.000Z",
   },
   {
    type: "radical",
    id: "legacy-radical",
    result: "known",
    answeredAt: "2026-08-17T03:00:00.000Z",
   },
  ];

  expect(buildHomeRecentActivity(history).map((item) => item.label)).toEqual([
   "Bộ thủ đã ôn",
   "Điểm ngữ pháp đã ôn",
   "Từ vựng đã ôn",
  ]);
 });

 it("returns only the four most recent events in newest-first order", () => {
  const history = Array.from(
   { length: 6 },
   (_, index): UserLearningState["reviewHistory"][number] => ({
    type: "vocab",
    id: `vocab-${index}`,
    label: `Từ ${index}`,
    result: "known",
    answeredAt: `2026-08-17T0${index}:00:00.000Z`,
   }),
  );

  expect(buildHomeRecentActivity(history).map((item) => item.label)).toEqual([
   "Từ 5",
   "Từ 4",
   "Từ 3",
   "Từ 2",
  ]);
 });
});
