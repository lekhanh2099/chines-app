import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getLessonDetail, requireAuthenticatedRoute } = vi.hoisted(() => ({
 getLessonDetail: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/repositories/hanzihome-content-repository", () => ({
 hanzihomeContentRepository: { getLessonDetail },
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("GET /api/hanzihome/lessons/:lessonId", () => {
 beforeEach(() => {
  getLessonDetail.mockReset();
  requireAuthenticatedRoute.mockReset();
 });

 it("serves a Studio lesson from bundled static content without querying Supabase", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });

  const response = await GET(new Request("https://app.example/api"), {
   params: Promise.resolve({ lessonId: "hanzihome-studio-grammar:lesson:HSK1" }),
  });

  expect(response.status).toBe(200);
  expect(requireAuthenticatedRoute).not.toHaveBeenCalled();
  expect(getLessonDetail).not.toHaveBeenCalled();
  const payload = await response.json();
  expect(payload.lesson.id).toBe("hanzihome-studio-grammar:lesson:HSK1");
  expect(payload.lesson.grammar.length).toBeGreaterThan(0);
 });

 it("keeps HanziHome lesson detail on the Supabase repository path", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getLessonDetail.mockResolvedValue({ id: "lesson-1", vocab: [], grammar: [] });

  const response = await GET(new Request("https://app.example/api"), {
   params: Promise.resolve({ lessonId: "lesson-1" }),
  });

  expect(response.status).toBe(200);
  expect(getLessonDetail).toHaveBeenCalledWith("lesson-1");
 });
});
