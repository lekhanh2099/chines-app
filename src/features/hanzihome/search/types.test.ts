import { describe, expect, it } from "vitest";

import { HanziHomeSearchIndexItemSchema } from "./types";

describe("HanziHome search index contract", () => {
 it("accepts the indexed item shape the server search builds", () => {
  const result = HanziHomeSearchIndexItemSchema.safeParse({
   id: "vocab-1",
   kind: "vocab",
   title: "你好",
   searchText: "你好 ni hao xin chao",
   metadata: { lessonNumber: 1, isCore: true, note: null },
  });

  expect(result.success).toBe(true);
 });

 it("rejects an item with an unknown kind or invalid metadata value", () => {
  const result = HanziHomeSearchIndexItemSchema.safeParse({
   id: "vocab-1",
   kind: "unknown-kind",
   title: "你好",
   searchText: "你好",
   metadata: { nested: { invalid: true } },
  });

  expect(result.success).toBe(false);
 });
});
