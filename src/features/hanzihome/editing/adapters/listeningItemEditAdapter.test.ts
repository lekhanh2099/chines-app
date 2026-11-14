import { afterEach, describe, expect, it, vi } from "vitest";

import type { HanziHomeEditableRecordMeta } from "@/features/hanzihome/types";

import { saveEditableNodeDirectly } from "../direct-save";
import { listeningItemEditAdapter } from "./listeningItemEditAdapter";

// A choice item without transcript/answer: both fields are absent, not null.
const listeningItem = {
 id: "item-1",
 sectionId: "section-1",
 order: 1,
 type: "sentence_mcq",
 promptZh: "他去哪儿？",
 options: [{ key: "A", textZh: "学校" }],
 metadata: {},
};
const record: HanziHomeEditableRecordMeta = {
 entityType: "listening_item",
 entityId: "item-1",
 dbId: "listening-db-1",
 updatedAt: "2026-11-01T00:00:00.000Z",
};

describe("listeningItemEditAdapter", () => {
 afterEach(() => vi.unstubAllGlobals());

 it("keeps absent JSON fields absent through a form round-trip", () => {
  const values = listeningItemEditAdapter.toValues(listeningItem);
  const node = listeningItemEditAdapter.toNode(listeningItem, values);

  expect(node).not.toHaveProperty("transcript");
  expect(node).not.toHaveProperty("answer");
  expect(node).toMatchObject({ options: listeningItem.options, metadata: {} });
 });

 it("saves a prompt-only edit of an item that has no transcript", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ item: { id: "listening-db-1" } }));
  vi.stubGlobal("fetch", fetchMock);
  const values = listeningItemEditAdapter.toValues(listeningItem);
  const after = listeningItemEditAdapter.toNode(listeningItem, {
   ...values,
   promptZh: "他明天去哪儿？",
  });

  await saveEditableNodeDirectly({
   node: {
    lessonId: "lesson-1",
    entityType: "listening_item",
    entityId: "item-1",
    path: ["listening", 0],
    value: listeningItem,
   },
   record,
   after,
   reason: "Sửa câu hỏi",
  });

  const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  expect(body.changes).toEqual({ prompt_zh: "他明天去哪儿？" });
 });
});
