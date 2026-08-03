import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import { POST } from "./route";

describe("POST /api/lookup/basic", () => {
 beforeEach(() => {
  getUser.mockReset();
 });

 it("rejects unauthenticated lookups before parsing or querying content", async () => {
  getUser.mockResolvedValue({ data: { user: null } });

  const response = await POST(
   new NextRequest("https://app.example/api/lookup/basic", {
    method: "POST",
    body: JSON.stringify({ text: "你好" }),
   }),
  );

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
 });

 it("rejects invalid lookup payloads at the route boundary", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

  const response = await POST(
   new NextRequest("https://app.example/api/lookup/basic", {
    method: "POST",
    body: JSON.stringify({ text: "" }),
   }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: "Invalid basic lookup payload" });
 });
});
