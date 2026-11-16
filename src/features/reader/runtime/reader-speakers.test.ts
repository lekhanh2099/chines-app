import { describe, expect, it } from "vitest";

import { cookReaderData } from "../model/cook-reader-data";
import { readerSpeakerIndexes } from "./reader-speakers";

describe("readerSpeakerIndexes", () => {
 it("numbers speakers by first appearance and restarts in each section", () => {
  const content = cookReaderData({
   id: "doc",
   language: "zh-CN",
   source: { kind: "lesson" },
   sections: [
    { id: "s1", title: "", segmentIds: ["a", "b", "c", "note"] },
    { id: "s2", title: "", segmentIds: ["d", "e"] },
   ],
   segments: [
    { id: "a", kind: "dialogue-turn", sectionId: "s1", zh: "一", speaker: { label: "王" } },
    { id: "b", kind: "dialogue-turn", sectionId: "s1", zh: "二", speaker: { label: "李" } },
    { id: "c", kind: "dialogue-turn", sectionId: "s1", zh: "三", speaker: { label: "王" } },
    { id: "note", kind: "paragraph", sectionId: "s1", zh: "四" },
    { id: "d", kind: "dialogue-turn", sectionId: "s2", zh: "五", speaker: { label: "李" } },
    { id: "e", kind: "dialogue-turn", sectionId: "s2", zh: "六", speaker: { label: "张" } },
   ],
   metadata: [],
   capabilities: [],
  });

  expect(Object.fromEntries(readerSpeakerIndexes(content))).toEqual({
   a: 0,
   b: 1,
   c: 0,
   d: 0,
   e: 1,
  });
 });
});
