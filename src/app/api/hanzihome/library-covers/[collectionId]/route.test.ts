import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuthenticatedRoute, hasHanziHomeContentCapability, rpc } = vi.hoisted(() => ({
 requireAuthenticatedRoute: vi.fn(),
 hasHanziHomeContentCapability: vi.fn(),
 rpc: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/public", () => ({
 publicSupabaseEnv: { url: "https://example.supabase.co", key: "test-publishable-key" },
}));
vi.mock("@/lib/api/authenticated-route", async (importOriginal) => {
 const actual = await importOriginal<typeof import("@/lib/api/authenticated-route")>();
 return { ...actual, requireAuthenticatedRoute };
});
vi.mock("@/features/hanzihome/server/content-capability", () => ({
 hasHanziHomeContentCapability,
}));

import { DELETE, PUT } from "./route";

const collectionId = "group:hanyu";
const timestamp = "2026-10-20T09:00:00.000Z";
const coverUrl = "https://images.example.test/cover.png";
const cover = { collectionId, coverUrl, createdAt: timestamp, updatedAt: timestamp };
const context = { params: Promise.resolve({ collectionId }) };

describe("/api/hanzihome/library-covers/[collectionId]", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: { rpc }, user: { id: "verified-editor" } },
  });
  hasHanziHomeContentCapability.mockResolvedValue(true);
  rpc.mockResolvedValue({ data: { item: cover }, error: null });
 });

 it.each([PUT, DELETE])(
  "rejects unauthenticated writes before checking roles or invoking CAS",
  async (handler) => {
   requireAuthenticatedRoute.mockResolvedValue({
    authenticated: false,
    response: Response.json({ error: "Unauthorized" }, { status: 401 }),
   });
   const response = await handler(
    new Request("https://app.example/api/hanzihome/library-covers/group%3Ahanyu"),
    context,
   );
   expect(response.status).toBe(401);
   expect(hasHanziHomeContentCapability).not.toHaveBeenCalled();
   expect(rpc).not.toHaveBeenCalled();
  },
 );

 it.each([PUT, DELETE])(
  "requires the verified actor's existing content capability",
  async (handler) => {
   hasHanziHomeContentCapability.mockResolvedValue(false);
   const response = await handler(
    new Request("https://app.example/api/hanzihome/library-covers/group%3Ahanyu"),
    context,
   );
   expect(response.status).toBe(403);
   expect(hasHanziHomeContentCapability).toHaveBeenCalledWith({ rpc }, "verified-editor");
   expect(rpc).not.toHaveBeenCalled();
  },
 );

 it("rejects unknown collection identities before invoking CAS", async () => {
  const response = await PUT(
   new Request("https://app.example/api/hanzihome/library-covers/course-a", {
    method: "PUT",
    body: JSON.stringify({ coverUrl }),
   }),
   { params: Promise.resolve({ collectionId: "course-a" }) },
  );
  expect(response.status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
 });

 it.each([
  { coverUrl: "javascript:alert(1)" },
  { coverUrl: "https://images.example.test:bad/cover.png" },
  { coverUrl, ownerId: "forged-owner" },
  { coverUrl, expectedUpdatedAt: "not-a-version" },
 ])("rejects invalid or ownership-forging payloads before persistence", async (payload) => {
  const response = await PUT(
   new Request("https://app.example/api/hanzihome/library-covers/group%3Ahanyu", {
    method: "PUT",
    body: JSON.stringify(payload),
   }),
   context,
  );
  expect(response.status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
 });

 it("creates only the named cover with observed absence and no client actor field", async () => {
  const response = await PUT(
   new Request("https://app.example/api/hanzihome/library-covers/group%3Ahanyu", {
    method: "PUT",
    body: JSON.stringify({ coverUrl }),
   }),
   context,
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(rpc).toHaveBeenCalledExactlyOnceWith("hanzihome_mutate_library_cover_as_user", {
   p_collection_id: collectionId,
   p_cover_url: coverUrl,
   p_expected_updated_at: undefined,
   p_reason: "Update HanziHome library cover",
  });
  await expect(response.json()).resolves.toEqual({ item: cover });
 });

 it("forwards the observed version and reason for an editor update", async () => {
  await PUT(
   new Request("https://app.example/api/hanzihome/library-covers/group%3Ahanyu", {
    method: "PUT",
    body: JSON.stringify({ coverUrl, expectedUpdatedAt: timestamp, reason: "Replace cover" }),
   }),
   context,
  );
  expect(rpc).toHaveBeenCalledExactlyOnceWith("hanzihome_mutate_library_cover_as_user", {
   p_collection_id: collectionId,
   p_cover_url: coverUrl,
   p_expected_updated_at: timestamp,
   p_reason: "Replace cover",
  });
 });

 it.each([
  { code: "40001", status: 409 },
  { code: "42501", status: 403 },
  { code: "28000", status: 401 },
  { code: "22023", status: 400 },
  { code: "23514", status: 400 },
  { code: "XX000", status: 500 },
 ])("preserves the database CAS/security failure status $code", async ({ code, status }) => {
  rpc.mockResolvedValue({ data: null, error: { code, message: "Rejected mutation" } });
  const response = await PUT(
   new Request("https://app.example/api/hanzihome/library-covers/group%3Ahanyu", {
    method: "PUT",
    body: JSON.stringify({ coverUrl, expectedUpdatedAt: timestamp }),
   }),
   context,
  );
  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toMatchObject({ details: code });
 });

 it("rejects a successful-looking acknowledgement for another collection", async () => {
  rpc.mockResolvedValue({ data: { item: { ...cover, collectionId: "group:other" } }, error: null });
  const response = await PUT(
   new Request("https://app.example/api/hanzihome/library-covers/group%3Ahanyu", {
    method: "PUT",
    body: JSON.stringify({ coverUrl }),
   }),
   context,
  );
  expect(response.status).toBe(500);
 });

 it("requires an observed version before resetting an override", async () => {
  const response = await DELETE(
   new Request("https://app.example/api/hanzihome/library-covers/group%3Ahanyu", {
    method: "DELETE",
    body: JSON.stringify({}),
   }),
   context,
  );
  expect(response.status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
 });

 it("resets exactly the named override through the audited CAS RPC", async () => {
  rpc.mockResolvedValue({ data: { collectionId, reset: true }, error: null });
  const response = await DELETE(
   new Request("https://app.example/api/hanzihome/library-covers/group%3Ahanyu", {
    method: "DELETE",
    body: JSON.stringify({ expectedUpdatedAt: timestamp }),
   }),
   context,
  );
  expect(response.status).toBe(200);
  expect(rpc).toHaveBeenCalledExactlyOnceWith("hanzihome_mutate_library_cover_as_user", {
   p_collection_id: collectionId,
   p_expected_updated_at: timestamp,
   p_reset: true,
   p_reason: "Reset HanziHome library cover",
  });
  await expect(response.json()).resolves.toEqual({ collectionId, reset: true });
 });

 it("does not acknowledge reset when another editor changed the cover", async () => {
  rpc.mockResolvedValue({ data: null, error: { code: "40001", message: "Conflict" } });
  const response = await DELETE(
   new Request("https://app.example/api/hanzihome/library-covers/group%3Ahanyu", {
    method: "DELETE",
    body: JSON.stringify({ expectedUpdatedAt: timestamp }),
   }),
   context,
  );
  expect(response.status).toBe(409);
 });
});
