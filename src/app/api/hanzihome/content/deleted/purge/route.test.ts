import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, rpc } = vi.hoisted(() => ({
 getUser: vi.fn(),
 rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser }, rpc })),
}));
vi.mock("@/features/hanzihome/server/canonical-content-mutation", () => ({
 mutationError: (message: string, status: number) => Response.json({ error: message }, { status }),
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 privateNoStoreJson: (body: unknown) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { POST } from "./route";

function request(body: unknown) {
 return new Request("https://app.example/api/hanzihome/content/deleted/purge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
}

const validBody = {
 entityType: "course",
 entityId: "course-1",
 expectedUpdatedAt: "2026-07-22T07:30:00.000Z",
 reason: "Xóa khóa học Course 1",
};

describe("POST /api/hanzihome/content/deleted/purge", () => {
 beforeEach(() => {
  getUser.mockReset();
  rpc.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "editor-1" } } });
 });

 it("requires an authenticated session", async () => {
  getUser.mockResolvedValue({ data: { user: null } });

  const response = await POST(request(validBody));

  expect(response.status).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
 });

 it("only accepts a purgeable hierarchy entity", async () => {
  const response = await POST(request({ ...validBody, entityType: "vocab_item" }));

  expect(response.status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
 });

 it("purges one soft-deleted hierarchy node through the session RPC", async () => {
  rpc.mockResolvedValue({
   data: { purged: { entityType: "course", entityId: "course-1" } },
   error: null,
  });

  const response = await POST(request(validBody));

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(rpc).toHaveBeenCalledWith("hanzihome_purge_deleted_content_as_user", {
   p_entity_type: "course",
   p_entity_id: "course-1",
   p_expected_updated_at: "2026-07-22T07:30:00.000Z",
   p_reason: "Xóa khóa học Course 1",
  });
 });

 it("returns a conflict when the deleted row changed", async () => {
  rpc.mockResolvedValue({
   data: null,
   error: { code: "40001", message: "HanziHome entity changed since it was loaded" },
  });

  const response = await POST(request(validBody));

  expect(response.status).toBe(409);
 });
});
