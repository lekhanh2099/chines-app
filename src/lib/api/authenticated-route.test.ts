import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import { apiError, privateNoStoreJson, requireAuthenticatedRoute } from "./authenticated-route";

describe("authenticated route contract", () => {
 beforeEach(() => {
  getUser.mockReset();
 });

 it("returns a stable 401 response when no session exists", async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: null });

  const result = await requireAuthenticatedRoute();

  expect(result.authenticated).toBe(false);
  if (result.authenticated) throw new Error("Expected unauthenticated result");
  expect(result.response.status).toBe(401);
  await expect(result.response.json()).resolves.toEqual({
   error: "Unauthorized",
   code: "UNAUTHORIZED",
  });
 });

 it("returns the verified user and session client", async () => {
  const user = { id: "user-1" };
  getUser.mockResolvedValue({ data: { user }, error: null });

  const result = await requireAuthenticatedRoute();

  expect(result.authenticated).toBe(true);
  if (!result.authenticated) throw new Error("Expected authenticated result");
  expect(result.context.user).toBe(user);
 });

 it("marks private API data as non-cacheable", async () => {
  const response = privateNoStoreJson({ ok: true });

  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ ok: true });
 });

 it("does not include an error code when none is supplied", async () => {
  const response = apiError("Invalid request", 400);

  await expect(response.json()).resolves.toEqual({ error: "Invalid request" });
 });
});
