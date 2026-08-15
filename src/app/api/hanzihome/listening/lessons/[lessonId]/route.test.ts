import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
 fetchListeningLessonBundle,
 getStaticStudioListeningLessonBundle,
 requireAuthenticatedRoute,
} = vi.hoisted(() => ({
 fetchListeningLessonBundle: vi.fn(),
 getStaticStudioListeningLessonBundle: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/listening/listening.repository", () => ({
 fetchListeningLessonBundle,
}));
vi.mock("@/features/hanzihome/static-json/studio-static-content", () => ({
 getStaticStudioListeningLessonBundle,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("GET /api/hanzihome/listening/lessons/[lessonId]", () => {
 beforeEach(() => {
  fetchListeningLessonBundle.mockReset();
  getStaticStudioListeningLessonBundle.mockReset();
  requireAuthenticatedRoute.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
 });

 it("serves Studio dictation from static JSON without querying Supabase", async () => {
  const bundle = {
   lesson: { id: "hanzihome-studio-dictation:hsk5-lesson-01", titleZh: "爱的细节" },
   sections: [],
   items: [],
  };
  getStaticStudioListeningLessonBundle.mockReturnValue(bundle);

  const response = await GET(new Request("https://app.example/api/hanzihome/listening/lessons/x"), {
   params: Promise.resolve({ lessonId: "hanzihome-studio-dictation:hsk5-lesson-01" }),
  });

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ bundle });
  expect(requireAuthenticatedRoute).not.toHaveBeenCalled();
  expect(fetchListeningLessonBundle).not.toHaveBeenCalled();
 });

 it("keeps the Supabase path for HanziHome listening lessons", async () => {
  fetchListeningLessonBundle.mockResolvedValue(null);

  const response = await GET(new Request("https://app.example/api/hanzihome/listening/lessons/x"), {
   params: Promise.resolve({ lessonId: "hanzihome-main:lesson-1" }),
  });

  expect(response.status).toBe(404);
  expect(fetchListeningLessonBundle).toHaveBeenCalledWith(undefined, "hanzihome-main:lesson-1");
 });
});
