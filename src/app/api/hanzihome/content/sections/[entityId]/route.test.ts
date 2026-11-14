import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JsonObject } from "@/types/json";

const { rpc, maybeSingle, from } = vi.hoisted(() => {
 const maybeSingle = vi.fn();
 const eq = vi.fn(() => ({ maybeSingle }));
 const select = vi.fn(() => ({ eq }));
 return { rpc: vi.fn(), maybeSingle, from: vi.fn(() => ({ select })) };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({
  auth: { getUser: async () => ({ data: { user: { id: "editor-1" } } }) },
  from,
  rpc,
 })),
}));

import { PATCH } from "./route";

const expectedUpdatedAt = "2026-11-01T00:00:00.000Z";
const storedPayload = {
 id: "vocabulary",
 type: "vocabulary",
 items: [],
 note_blocks: [
  { id: "kept", text: "visible" },
  { id: "hidden", text: "soft-deleted", deleted_at: "2026-10-01T00:00:00.000Z" },
 ],
};

function patch(changes: JsonObject) {
 return PATCH(
  new Request("https://app.example/api/hanzihome/content/sections/section-1", {
   method: "PATCH",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ reason: "Sửa đề mục", expectedUpdatedAt, changes }),
  }),
  { params: Promise.resolve({ entityId: "section-1" }) },
 );
}

describe("PATCH /api/hanzihome/content/sections/:entityId", () => {
 beforeEach(() => {
  rpc.mockReset();
  maybeSingle.mockReset();
  from.mockClear();
  rpc.mockResolvedValue({ data: { item: { id: "section-1" } }, error: null });
  maybeSingle.mockResolvedValue({
   data: { payload: storedPayload, section_type: "vocabulary" },
   error: null,
  });
 });

 it("merges an edited payload key over the stored payload instead of replacing it", async () => {
  const response = await patch({ title_vi: "Từ mới", payload: { empty_reason_vi: "Chưa có" } });

  expect(response.status).toBe(200);
  expect(rpc).toHaveBeenCalledWith(
   "hanzihome_mutate_content_as_user",
   expect.objectContaining({
    p_expected_updated_at: expectedUpdatedAt,
    p_changes: {
     title_vi: "Từ mới",
     payload: { ...storedPayload, empty_reason_vi: "Chưa có" },
    },
   }),
  );
 });

 it("rejects vocabulary items in a vocabulary section payload", async () => {
  const response = await patch({ payload: { items: [{ id: "v1", hanzi: "你" }] } });

  expect(response.status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
 });

 it("does not read the stored payload for a title-only edit", async () => {
  const response = await patch({ title_vi: "Từ mới" });

  expect(response.status).toBe(200);
  expect(from).not.toHaveBeenCalled();
  expect(rpc).toHaveBeenCalledWith(
   "hanzihome_mutate_content_as_user",
   expect.objectContaining({ p_changes: { title_vi: "Từ mới" } }),
  );
 });

 it("rejects changing a populated section to vocabulary without a payload patch", async () => {
  maybeSingle.mockResolvedValue({
   data: { section_type: "reading", payload: { items: [{ id: "reading-1" }] } },
   error: null,
  });

  const response = await patch({ section_type: "vocabulary" });

  expect(response.status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
 });

 it("checks the resulting section type when a payload patch accompanies the change", async () => {
  maybeSingle.mockResolvedValue({
   data: { section_type: "reading", payload: { items: [] } },
   error: null,
  });

  const response = await patch({
   section_type: "vocabulary",
   payload: { items: [{ id: "v1", hanzi: "你" }] },
  });

  expect(response.status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
 });
});
