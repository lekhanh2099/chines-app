import { afterEach, describe, expect, it, vi } from "vitest";

import type { EditableNodeRequest } from "./store/types";
import type { HanziHomeEditableRecordMeta } from "@/features/hanzihome/types";

import { saveEditableNodeDirectly } from "./direct-save";

// The rendered vocabulary section is a read model: canonical vocabulary is
// attached to `items` and soft-deleted nested nodes are already removed.
const renderedSection = {
 id: "vocabulary",
 type: "vocabulary",
 order: 1,
 title: "生词",
 title_vi: "Từ mới",
 items: [{ id: "v1", type: "vocabulary_item", hanzi: "你", pinyin: "nǐ" }],
};
const record: HanziHomeEditableRecordMeta = {
 entityType: "section",
 entityId: "vocabulary",
 dbId: "section-db-1",
 updatedAt: "2026-11-01T00:00:00.000Z",
};
const node: EditableNodeRequest = {
 lessonId: "lesson-1",
 entityType: "section",
 entityId: "vocabulary",
 path: ["sections", 0],
 value: renderedSection,
};

function sentChanges(fetchMock: ReturnType<typeof vi.fn>) {
 const init = fetchMock.mock.calls[0]?.[1];
 return JSON.parse(String(init?.body)).changes;
}

describe("saveEditableNodeDirectly for sections", () => {
 afterEach(() => vi.unstubAllGlobals());

 it("sends only the edited title, never the hydrated payload", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ item: { id: "section-db-1" } }));
  vi.stubGlobal("fetch", fetchMock);

  await saveEditableNodeDirectly({
   node,
   record,
   after: { ...renderedSection, title_vi: "Từ vựng mới", empty_reason_vi: "" },
   reason: "Sửa đề mục",
  });

  expect(fetchMock).toHaveBeenCalledWith(
   "/api/hanzihome/content/sections/section-db-1",
   expect.objectContaining({ method: "PATCH" }),
  );
  expect(sentChanges(fetchMock)).toEqual({ title_vi: "Từ vựng mới" });
 });

 it("sends an empty-reason edit as a payload patch without vocabulary items", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ item: { id: "section-db-1" } }));
  vi.stubGlobal("fetch", fetchMock);

  await saveEditableNodeDirectly({
   node,
   record,
   after: { ...renderedSection, empty_reason_vi: "Bài này không có từ mới" },
   reason: "Sửa đề mục",
  });

  expect(sentChanges(fetchMock)).toEqual({
   payload: { empty_reason_vi: "Bài này không có từ mới" },
  });
 });
});
