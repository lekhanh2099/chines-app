import { describe, expect, it } from "vitest";

import { buildCopyablePinyin } from "./copy-pinyin";

describe("buildCopyablePinyin", () => {
 it("replaces Hanzi with contextual Pinyin and keeps labels and line breaks", () => {
  const pinyin = buildCopyablePinyin({ text: "2. 团聚\nA. 一家人在一起" });
  expect(pinyin).toBe("2. tuánjù\nA. yìjiā rén zàiyìqǐ");
 });

 it("returns an empty string when there is nothing to read", () => {
  expect(buildCopyablePinyin({ text: "   " })).toBe("");
 });
});
