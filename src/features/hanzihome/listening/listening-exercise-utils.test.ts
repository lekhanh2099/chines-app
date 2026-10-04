import { expect, it } from "vitest";
import {
 isListeningBlankCorrect,
 isListeningChoiceCorrect,
 isListeningBooleanCorrect,
 isListeningMatchingCorrect,
 groupListeningShadowingItems,
 splitListeningStress,
} from "./listening-exercise-utils";
import type { ListeningRuntimeItem } from "./listening.types";

const matching: ListeningRuntimeItem = {
 id: "m",
 sectionId: "s",
 order: 1,
 type: "matching",
 options: [],
 metadata: {
  right: [
   { id: "r1", textZh: "右" },
   { id: "r2", textZh: "右二" },
  ],
 },
 answer: {
  type: "matching",
  pairs: [
   { left: "l1", right: "r1" },
   { left: "l2", right: "r2" },
  ],
 },
};
it("requires real matching answers for every right entry", () => {
 expect(isListeningMatchingCorrect(matching, { r1: "l1", r2: "l2" })).toBe(true);
 expect(isListeningMatchingCorrect(matching, { r1: "l2", r2: "l1" })).toBe(false);
 expect(isListeningMatchingCorrect(matching, { r1: "l1" })).toBe(false);
 expect(isListeningMatchingCorrect({ ...matching, answer: undefined }, {})).toBe(false);
 expect(isListeningMatchingCorrect({ ...matching, metadata: {} }, {})).toBe(false);
});
it("trims learner fill answers without changing the existing exact answer policy", () => {
 const item = { ...matching, metadata: { acceptedAnswers: ["学习", "学"] } };
 expect(isListeningBlankCorrect(item, " 学习 ")).toBe(true);
 expect(isListeningBlankCorrect(item, "学习。")).toBe(false);
});
it("grades choice and boolean answers only against their authoritative answer kind", () => {
 const choice: ListeningRuntimeItem = { ...matching, answer: { type: "choice", value: "A" } };
 const boolean: ListeningRuntimeItem = { ...matching, answer: { type: "boolean", value: false } };
 expect(isListeningChoiceCorrect(choice, "A")).toBe(true);
 expect(isListeningChoiceCorrect(choice, "B")).toBe(false);
 expect(isListeningChoiceCorrect(boolean, "false")).toBe(false);
 expect(isListeningBooleanCorrect(boolean, "false")).toBe(true);
 expect(isListeningBooleanCorrect(boolean, "true")).toBe(false);
 expect(isListeningBooleanCorrect({ ...boolean, answer: undefined }, "")).toBe(false);
});
it("groups shadowing items in encounter order without mutating the source list", () => {
 const first: ListeningRuntimeItem = { ...matching, id: "first", metadata: { groupId: "one" } };
 const second: ListeningRuntimeItem = { ...matching, id: "second", metadata: {} };
 const third: ListeningRuntimeItem = { ...matching, id: "third", metadata: { groupId: "one" } };
 const items = [first, second, third];
 expect(groupListeningShadowingItems(items)).toEqual([
  ["one", [first, third]],
  ["shadowing", [second]],
 ]);
 expect(items).toEqual([first, second, third]);
});
it("escapes literal stress markers, prioritizes longest overlap and preserves source text", () => {
 const parts = splitListeningStress("学习学(a+b)", ["学", "学习", "a+b"]);
 expect(parts.filter((part) => part.stressed).map((part) => part.text)).toEqual([
  "学习",
  "学",
  "a+b",
 ]);
 expect(parts.map((part) => part.text).join("")).toBe("学习学(a+b)");
 expect(splitListeningStress("原文", [""])).toEqual([{ text: "原文", stressed: false }]);
});
