import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getStaticStudioListeningLessonBundle } = vi.hoisted(() => ({
 getStaticStudioListeningLessonBundle: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/static-json/studio-static-content", () => ({
 getStaticStudioListeningLessonBundle,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("GET /api/hanzihome/listening/lessons/[lessonId]", () => {
 beforeEach(() => {
  getStaticStudioListeningLessonBundle.mockReset();
 });

 it("serves Studio dictation from static JSON", async () => {
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
 });

 it("answers not found for a lesson outside the Studio dictation course", async () => {
  const response = await GET(new Request("https://app.example/api/hanzihome/listening/lessons/x"), {
   params: Promise.resolve({ lessonId: "hanzihome-main:lesson-1" }),
  });

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
   error: "Listening lesson not found",
   code: "LISTENING_LESSON_NOT_FOUND",
  });
  expect(getStaticStudioListeningLessonBundle).not.toHaveBeenCalled();
 });
});
