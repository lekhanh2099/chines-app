import { beforeEach, describe, expect, it, vi } from "vitest";

const { getLessonVocabulary, requireAuthenticatedRoute } = vi.hoisted(() => ({
 getLessonVocabulary: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/repositories/hanzihome-content-repository", () => ({
 hanzihomeContentRepository: { getLessonVocabulary },
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: unknown) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("GET /api/hanzihome/lessons/:lessonId/vocabulary", () => {
 beforeEach(() => {
  getLessonVocabulary.mockReset();
  requireAuthenticatedRoute.mockReset();
 });

 it("does not query vocabulary without an authenticated session", async () => {
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const response = await GET(new Request("https://app.example/api"), {
   params: Promise.resolve({ lessonId: "lesson-1" }),
  });

  expect(response.status).toBe(401);
  expect(getLessonVocabulary).not.toHaveBeenCalled();
 });

 it("returns the dedicated lesson vocabulary resource", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getLessonVocabulary.mockResolvedValue({ lessonId: "lesson-1", words: [] });

  const response = await GET(new Request("https://app.example/api"), {
   params: Promise.resolve({ lessonId: "lesson-1" }),
  });

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(getLessonVocabulary).toHaveBeenCalledWith("lesson-1");
  await expect(response.json()).resolves.toEqual({
   resource: { lessonId: "lesson-1", words: [] },
  });
 });
});
