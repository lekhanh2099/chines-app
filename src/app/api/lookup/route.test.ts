import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import { POST } from "./route";

describe("POST /api/lookup", () => {
 beforeEach(() => {
  getUser.mockReset();
 });

 it("rejects unauthenticated dictionary lookups", async () => {
  getUser.mockResolvedValue({ data: { user: null } });

  const response = await POST(
   new NextRequest("https://app.example/api/lookup", {
    method: "POST",
    body: JSON.stringify({ text: "你好", type: "word" }),
   }),
  );

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
 });

 it("rejects unsupported lookup types at the route boundary", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

  const response = await POST(
   new NextRequest("https://app.example/api/lookup", {
    method: "POST",
    body: JSON.stringify({ text: "你好", type: "unsupported" }),
   }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: "Invalid lookup payload" });
 });
});
