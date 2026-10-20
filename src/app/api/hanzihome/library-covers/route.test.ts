import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuthenticatedRoute, from, select, order } = vi.hoisted(() => ({
 requireAuthenticatedRoute: vi.fn(),
 from: vi.fn(),
 select: vi.fn(),
 order: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/public", () => ({
 publicSupabaseEnv: { url: "https://example.supabase.co", key: "test-publishable-key" },
}));
vi.mock("@/lib/api/authenticated-route", async (importOriginal) => {
 const actual = await importOriginal<typeof import("@/lib/api/authenticated-route")>();
 return { ...actual, requireAuthenticatedRoute };
});

import { GET } from "./route";

describe("GET /api/hanzihome/library-covers", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  from.mockReturnValue({ select });
  select.mockReturnValue({ order });
  order.mockResolvedValue({ data: [], error: null });
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: { from }, user: { id: "ordinary-learner" } },
  });
 });

 it("requires a verified session before reading shared covers", async () => {
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });
  expect((await GET()).status).toBe(401);
  expect(from).not.toHaveBeenCalled();
 });

 it("lets ordinary authenticated learners read only cover metadata with private caching", async () => {
  order.mockResolvedValue({
   data: [
    {
     collection_id: "static:nhip-cau",
     cover_url: "https://images.example.test/bridge.png",
     created_at: "2026-10-20T09:00:00.000Z",
     updated_at: "2026-10-20T09:01:00.000Z",
    },
   ],
   error: null,
  });
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(from).toHaveBeenCalledWith("hanzihome_library_covers");
  expect(select).toHaveBeenCalledWith("collection_id, cover_url, created_at, updated_at");
  expect(order).toHaveBeenCalledWith("collection_id");
  await expect(response.json()).resolves.toEqual({
   items: [
    {
     collectionId: "static:nhip-cau",
     coverUrl: "https://images.example.test/bridge.png",
     createdAt: "2026-10-20T09:00:00.000Z",
     updatedAt: "2026-10-20T09:01:00.000Z",
    },
   ],
  });
 });

 it("returns absence without manufacturing a persisted default cover", async () => {
  const response = await GET();
  await expect(response.json()).resolves.toEqual({ items: [] });
 });

 it("reports an unavailable schema without exposing database details or hiding the error", async () => {
  order.mockResolvedValue({
   data: null,
   error: { code: "42P01", message: "private database detail" },
  });
  const response = await GET();
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toEqual({
   error: "Could not load library covers",
   code: "LIBRARY_COVERS_UNAVAILABLE",
  });
 });

 it("rejects malformed stored metadata instead of returning an unversioned override", async () => {
  order.mockResolvedValue({
   data: [{ collection_id: "group:hanyu", cover_url: "https://images.example.test/cover.png" }],
   error: null,
  });
  const response = await GET();
  expect(response.status).toBe(500);
 });
});
