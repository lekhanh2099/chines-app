import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JsonFieldValue } from "@/types/json";

const { getUser, hasHanziHomeContentCapability, requireSessionOrBearerAuthenticatedRoute } =
 vi.hoisted(() => ({
  getUser: vi.fn(),
  hasHanziHomeContentCapability: vi.fn(),
  requireSessionOrBearerAuthenticatedRoute: vi.fn(),
 }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser } })),
}));
vi.mock("@/features/hanzihome/server/content-capability", () => ({
 hasHanziHomeContentCapability,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 apiError: (message: string, status: number, code?: string) =>
  Response.json(
   { error: message, ...(code ? { code } : {}) },
   { status, headers: { "Cache-Control": "private, no-store" } },
  ),
 privateNoStoreJson: (body: JsonFieldValue, init?: Omit<ResponseInit, "headers">) =>
  Response.json(body, { ...init, headers: { "Cache-Control": "private, no-store" } }),
 requireSessionOrBearerAuthenticatedRoute,
}));

import { GET, POST } from "./route";

describe("/api/hanzihome/html-artifacts", () => {
 beforeEach(() => {
  getUser.mockReset();
  hasHanziHomeContentCapability.mockReset();
  hasHanziHomeContentCapability.mockResolvedValue(true);
  requireSessionOrBearerAuthenticatedRoute.mockReset();
 });

 it("rejects unauthenticated artifact reads", async () => {
  requireSessionOrBearerAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json(
    { error: "Unauthorized", code: "UNAUTHORIZED" },
    { status: 401, headers: { "Cache-Control": "private, no-store" } },
   ),
  });

  const response = await GET(new Request("https://app.example/api/hanzihome/html-artifacts"));

  expect(response.status).toBe(401);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized", code: "UNAUTHORIZED" });
 });

 it("keeps artifact reads scoped to the verified bearer owner", async () => {
  const artifactLimit = vi.fn().mockResolvedValue({ data: [], error: null });
  const artifactOrder = vi.fn(() => ({ limit: artifactLimit }));
  const artifactOwner = vi.fn(() => ({ order: artifactOrder }));
  const artifactSelect = vi.fn(() => ({ eq: artifactOwner }));
  const folderFinalOrder = vi.fn().mockResolvedValue({ data: [], error: null });
  const folderInitialOrder = vi.fn(() => ({ order: folderFinalOrder }));
  const folderOwner = vi.fn(() => ({ order: folderInitialOrder }));
  const folderSelect = vi.fn(() => ({ eq: folderOwner }));
  const from = vi.fn((table: string) =>
   table === "hanzihome_html_artifacts" ? { select: artifactSelect } : { select: folderSelect },
  );

  requireSessionOrBearerAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: { from }, user: { id: "bearer-user" } },
  });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/html-artifacts?limit=25", {
    headers: { Authorization: "Bearer access-token" },
   }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(artifactOwner).toHaveBeenCalledWith("owner_id", "bearer-user");
  expect(folderOwner).toHaveBeenCalledWith("owner_id", "bearer-user");
  expect(artifactLimit).toHaveBeenCalledWith(25);
  await expect(response.json()).resolves.toEqual({ items: [], folders: [] });
 });

 it("rejects malformed artifact writes before touching the repository", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

  const response = await POST(
   new Request("https://app.example/api/hanzihome/html-artifacts", {
    method: "POST",
    body: JSON.stringify({ title: "" }),
   }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
   error: "Invalid HTML artifact payload",
  });
 });

 it("does not turn the internal create route into a Bearer write endpoint", async () => {
  getUser.mockResolvedValue({ data: { user: null } });

  const response = await POST(
   new Request("https://app.example/api/hanzihome/html-artifacts", {
    method: "POST",
    headers: { Authorization: "Bearer access-token" },
   }),
  );

  expect(response.status).toBe(401);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
 });
});
