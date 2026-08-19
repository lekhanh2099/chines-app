import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, rpc } = vi.hoisted(() => ({
 getUser: vi.fn(),
 rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser }, rpc })),
}));
vi.mock("@/features/hanzihome/server/canonical-content-mutation", () => ({
 mutationError: (message: string, status: number) => Response.json({ error: message }, { status }),
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { POST } from "./route";

function request(body: JsonFieldValue) {
 return new Request("https://app.example/api/hanzihome/content/vocab-children/bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
}

describe("POST /api/hanzihome/content/vocab-children/bulk", () => {
 beforeEach(() => {
  getUser.mockReset();
  rpc.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "editor-1" } } });
 });

 it("lists one server-side page with the requested filters", async () => {
  rpc.mockResolvedValue({ data: { page: 2, pageSize: 25, total: 30, rows: [] }, error: null });

  const response = await POST(
   request({
    action: "list",
    entityType: "vocab_detail_section",
    scopeType: "book",
    scopeId: "book-1",
    sectionKeys: ["notes"],
    page: 2,
    pageSize: 25,
   }),
  );

  expect(response.status).toBe(200);
  expect(rpc).toHaveBeenCalledWith("hanzihome_list_vocab_children", {
   p_deleted: false,
   p_entity_type: "vocab_detail_section",
   p_page: 2,
   p_page_size: 25,
   p_query: undefined,
   p_scope_id: "book-1",
   p_scope_type: "book",
   p_section_keys: ["notes"],
  });
 });

 it("requires the preview fingerprint before mutating", async () => {
  const response = await POST(
   request({
    action: "mutate",
    entityType: "vocab_example",
    scopeType: "lesson",
    scopeId: "lesson-1",
    operation: "purge",
    reason: "Purge deleted examples",
   }),
  );

  expect(response.status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
 });

 it("maps a changed preview fingerprint to a conflict", async () => {
  rpc.mockResolvedValue({ data: null, error: { code: "40001", message: "Selection changed" } });

  const response = await POST(
   request({
    action: "mutate",
    entityType: "vocab_example",
    scopeType: "lesson",
    scopeId: "lesson-1",
    operation: "soft_delete",
    expectedCount: 2,
    expectedFingerprint: "fingerprint-1",
    reason: "Remove duplicate examples",
    ids: ["example-1", "example-2"],
   }),
  );

  expect(response.status).toBe(409);
 });
});
