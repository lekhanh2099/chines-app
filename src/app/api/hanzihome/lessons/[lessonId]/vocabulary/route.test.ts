import type { JsonFieldValue } from "@/types/json";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/authenticated-route", () => ({
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("GET /api/hanzihome/lessons/:lessonId/vocabulary", () => {
 it("serves Studio lesson vocabulary from bundled static content", async () => {
  const response = await GET(new Request("https://app.example/api"), {
   params: Promise.resolve({ lessonId: "hanzihome-studio-reading:U3-R1" }),
  });

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const payload = await response.json();
  expect(payload.resource.lessonId).toBe("hanzihome-studio-reading:U3-R1");
  expect(payload.resource.items.length).toBeGreaterThan(0);
  expect(payload.resource.total).toBe(payload.resource.items.length);
 });

 it("answers not found for a lesson that is not bundled Studio content", async () => {
  const response = await GET(new Request("https://app.example/api"), {
   params: Promise.resolve({ lessonId: "lesson-1" }),
  });

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
   error: "Lesson not found",
   code: "LESSON_NOT_FOUND",
  });
 });
});
