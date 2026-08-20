import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 createLessonAnnotation: vi.fn(),
 listLessonAnnotations: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
 createServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/annotations/lesson-annotation-repository.server", () => ({
 createLessonAnnotation: mocks.createLessonAnnotation,
 listLessonAnnotations: mocks.listLessonAnnotations,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));
vi.mock("@/lib/supabase/service-role.server", () => ({
 createServiceRoleSupabaseClient: mocks.createServiceRoleSupabaseClient,
}));

import { GET, POST } from "./route";

describe("/api/hanzihome/lesson-annotations", () => {
 const authority = { scope: "service-role" };
 const context = { user: { id: "user-1" } };

 beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context });
  mocks.createServiceRoleSupabaseClient.mockReturnValue(authority);
 });

 it("stops unauthenticated annotation reads before creating service authority", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/lesson-annotations?lessonId=lesson-1"),
  );

  expect(response.status).toBe(401);
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
  expect(mocks.listLessonAnnotations).not.toHaveBeenCalled();
 });

 it("reads only the authenticated owner annotations through service authority", async () => {
  mocks.listLessonAnnotations.mockResolvedValue([]);

  const response = await GET(
   new Request("https://app.example/api/hanzihome/lesson-annotations?lessonId=lesson-1"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.listLessonAnnotations).toHaveBeenCalledWith(authority, "user-1", "lesson-1");
 });

 it("rejects malformed create payloads before service authority is created", async () => {
  const response = await POST(
   new Request("https://app.example/api/hanzihome/lesson-annotations", {
    method: "POST",
    body: JSON.stringify({ lessonId: "lesson-1" }),
   }),
  );

  expect(response.status).toBe(400);
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
 });

 it("creates a lesson annotation with the server-derived user id", async () => {
  const anchor = {
   lessonId: "lesson-1",
   nodeType: "paragraph",
   nodeId: "node-1",
   startOffset: 0,
   endOffset: 2,
   selectedText: "学习",
   prefixText: "",
   suffixText: "中文",
  };
  const annotation = {
   ...anchor,
   id: "annotation-1",
   tone: "focus",
   noteId: null,
   noteText: "",
   createdAt: "now",
   updatedAt: "now",
  };
  mocks.createLessonAnnotation.mockResolvedValue(annotation);

  const response = await POST(
   new Request("https://app.example/api/hanzihome/lesson-annotations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anchor }),
   }),
  );

  expect(response.status).toBe(200);
  expect(mocks.createLessonAnnotation).toHaveBeenCalledWith(authority, "user-1", { anchor });
  await expect(response.json()).resolves.toEqual({ annotation });
 });
});
