import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import { POST } from "./route";

describe("POST /api/editor/context", () => {
 beforeEach(() => {
  getUser.mockReset();
 });

 it("rejects unauthenticated AI editor requests before parsing the body", async () => {
  getUser.mockResolvedValue({ data: { user: null } });

  const response = await POST(
   new NextRequest("https://app.example/api/editor/context", {
    method: "POST",
    body: "not-json",
   }),
  );

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
 });
});
