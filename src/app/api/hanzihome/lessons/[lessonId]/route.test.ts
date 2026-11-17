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

describe("GET /api/hanzihome/lessons/:lessonId", () => {
 it("serves a Studio lesson from bundled static content", async () => {
  const response = await GET(new Request("https://app.example/api"), {
   params: Promise.resolve({ lessonId: "hanzihome-studio-grammar:lesson:HSK1" }),
  });

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const payload = await response.json();
  expect(payload.lesson.id).toBe("hanzihome-studio-grammar:lesson:HSK1");
  expect(payload.lesson.grammar.length).toBeGreaterThan(0);
 });

 it.each(["lesson-1", "02fe6df4-83d4-4c2d-9cce-e119bdd63a11", "hanzihome-studio-grammar:missing"])(
  "answers not found for %s, which is not a bundled Studio lesson",
  async (lessonId) => {
   const response = await GET(new Request("https://app.example/api"), {
    params: Promise.resolve({ lessonId }),
   });

   expect(response.status).toBe(404);
   await expect(response.json()).resolves.toEqual({
    error: "Lesson not found",
    code: "LESSON_NOT_FOUND",
   });
  },
 );
});
