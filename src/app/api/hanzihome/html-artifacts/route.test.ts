import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import { GET, POST } from "./route";

describe("/api/hanzihome/html-artifacts", () => {
 beforeEach(() => {
  getUser.mockReset();
 });

 it("rejects unauthenticated artifact reads", async () => {
  getUser.mockResolvedValue({ data: { user: null } });

  const response = await GET(new Request("https://app.example/api/hanzihome/html-artifacts"));

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
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
});
