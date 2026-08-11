import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBearerSupabaseClient, getBearerUser, getUser } = vi.hoisted(() => ({
 createBearerSupabaseClient: vi.fn(),
 getBearerUser: vi.fn(),
 getUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({
 createClient: createBearerSupabaseClient,
}));
vi.mock("@/lib/env/public", () => ({
 publicSupabaseEnv: {
  key: "public-anon-key",
  url: "https://project.supabase.co",
 },
}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
 requireSessionOrBearerAuthenticatedRoute,
} from "./authenticated-route";

describe("authenticated route contract", () => {
 beforeEach(() => {
  createBearerSupabaseClient.mockReset();
  getBearerUser.mockReset();
  getUser.mockReset();
 });

 it("returns a stable 401 response when no session exists", async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: null });

  const result = await requireAuthenticatedRoute();

  expect(result.authenticated).toBe(false);
  if (result.authenticated) throw new Error("Expected unauthenticated result");
  expect(result.response.status).toBe(401);
  expect(result.response.headers.get("Cache-Control")).toBe("private, no-store");
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

 it("keeps the cookie session path when no Bearer header is supplied", async () => {
  const user = { id: "session-user" };
  getUser.mockResolvedValue({ data: { user }, error: null });

  const result = await requireSessionOrBearerAuthenticatedRoute(
   new Request("https://app.example/api/hanzihome/html-artifacts"),
  );

  expect(result.authenticated).toBe(true);
  if (!result.authenticated) throw new Error("Expected authenticated result");
  expect(result.context.user).toBe(user);
  expect(createBearerSupabaseClient).not.toHaveBeenCalled();
 });

 it("verifies a supplied Bearer token before exposing a bearer client", async () => {
  const user = { id: "bearer-user" };
  createBearerSupabaseClient.mockReturnValue({ auth: { getUser: getBearerUser } });
  getBearerUser.mockResolvedValue({ data: { user }, error: null });

  const result = await requireSessionOrBearerAuthenticatedRoute(
   new Request("https://app.example/api/hanzihome/html-artifacts", {
    headers: { Authorization: "Bearer access-token" },
   }),
  );

  expect(result.authenticated).toBe(true);
  if (!result.authenticated) throw new Error("Expected authenticated result");
  expect(result.context.user).toBe(user);
  expect(getUser).not.toHaveBeenCalled();
  expect(getBearerUser).toHaveBeenCalledWith("access-token");
  expect(createBearerSupabaseClient).toHaveBeenCalledWith(
   "https://project.supabase.co",
   "public-anon-key",
   expect.objectContaining({
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: "Bearer access-token" } },
   }),
  );
 });

 it("rejects malformed or invalid Authorization headers without a cookie fallback", async () => {
  const malformed = await requireSessionOrBearerAuthenticatedRoute(
   new Request("https://app.example/api/hanzihome/html-artifacts", {
    headers: { Authorization: "Basic access-token" },
   }),
  );

  expect(malformed.authenticated).toBe(false);
  if (malformed.authenticated) throw new Error("Expected unauthenticated result");
  expect(malformed.response.status).toBe(401);
  expect(getUser).not.toHaveBeenCalled();
  expect(createBearerSupabaseClient).not.toHaveBeenCalled();

  const empty = await requireSessionOrBearerAuthenticatedRoute(
   new Request("https://app.example/api/hanzihome/html-artifacts", {
    headers: { Authorization: "" },
   }),
  );

  expect(empty.authenticated).toBe(false);
  if (empty.authenticated) throw new Error("Expected unauthenticated result");
  expect(empty.response.status).toBe(401);
  expect(getUser).not.toHaveBeenCalled();

  createBearerSupabaseClient.mockReturnValue({ auth: { getUser: getBearerUser } });
  getBearerUser.mockResolvedValue({ data: { user: null }, error: null });

  const invalid = await requireSessionOrBearerAuthenticatedRoute(
   new Request("https://app.example/api/hanzihome/html-artifacts", {
    headers: { Authorization: "Bearer invalid-token" },
   }),
  );

  expect(invalid.authenticated).toBe(false);
  if (invalid.authenticated) throw new Error("Expected unauthenticated result");
  expect(invalid.response.status).toBe(401);
  expect(invalid.response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(getUser).not.toHaveBeenCalled();
 });

 it("marks private API data as non-cacheable", async () => {
  const response = privateNoStoreJson({ ok: true });

  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ ok: true });
 });

 it("does not include an error code when none is supplied", async () => {
  const response = apiError("Invalid request", 400);

  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ error: "Invalid request" });
 });
});
