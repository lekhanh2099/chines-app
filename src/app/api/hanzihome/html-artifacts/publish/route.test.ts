import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/public", () => ({
 publicSupabaseEnv: {
  key: "public-anon-key",
  url: "https://project.supabase.co",
 },
}));
vi.mock("@/lib/env/server", () => ({
 getSupabaseServerSecret: vi.fn(() => "service-role-key"),
}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import { GET, POST } from "./route";

describe("/api/hanzihome/html-artifacts/publish", () => {
 beforeEach(() => {
  getUser.mockReset();
 });

 it("returns authenticated connection status without exposing a secret", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

  const response = await GET();

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({
   sessionUserId: "user-1",
   publishTokenEnabled: Boolean(process.env.HANZIHOME_HTML_PUBLISH_TOKEN),
   publishOwnerId: process.env.HANZIHOME_HTML_PUBLISH_OWNER_ID ?? null,
   serviceRoleEnabled: Boolean(
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
   ),
  });
 });

 it("rejects an unauthenticated external publish request with private caching", async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: null });

  const response = await POST(
   new Request("https://app.example/api/hanzihome/html-artifacts/publish", { method: "POST" }),
  );

  expect(response.status).toBe(401);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
 });
});
