import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 deleteLessonAnnotation: vi.fn(),
 updateLessonAnnotationNote: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
 createServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/annotations/lesson-annotation-repository.server", () => ({
 deleteLessonAnnotation: mocks.deleteLessonAnnotation,
 updateLessonAnnotationNote: mocks.updateLessonAnnotationNote,
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

import { DELETE, PATCH } from "./route";

const annotationId = "e2e0f314-e8c9-4a76-a5a0-607133b58a72";
const routeContext = { params: Promise.resolve({ annotationId }) };

describe("/api/hanzihome/lesson-annotations/[annotationId]", () => {
 const authority = { scope: "service-role" };
 const context = { user: { id: "user-1" } };

 beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context });
  mocks.createServiceRoleSupabaseClient.mockReturnValue(authority);
 });

 it("rejects malformed annotation ids before privileged work", async () => {
  const response = await PATCH(
   new Request("https://app.example/api/hanzihome/lesson-annotations/not-a-uuid", {
    method: "PATCH",
    body: JSON.stringify({ noteText: "Ghi chú" }),
   }),
   { params: Promise.resolve({ annotationId: "not-a-uuid" }) },
  );

  expect(response.status).toBe(400);
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
 });

 it("updates an owned annotation through service authority", async () => {
  const annotation = { id: annotationId };
  mocks.updateLessonAnnotationNote.mockResolvedValue(annotation);

  const response = await PATCH(
   new Request(`https://app.example/api/hanzihome/lesson-annotations/${annotationId}`, {
    method: "PATCH",
    body: JSON.stringify({ noteText: "Ghi chú" }),
   }),
   routeContext,
  );

  expect(response.status).toBe(200);
  expect(mocks.updateLessonAnnotationNote).toHaveBeenCalledWith(authority, "user-1", {
   annotationId,
   noteText: "Ghi chú",
  });
 });

 it("deletes only through the server-derived owner", async () => {
  mocks.deleteLessonAnnotation.mockResolvedValue(true);

  const response = await DELETE(
   new Request(`https://app.example/api/hanzihome/lesson-annotations/${annotationId}`, {
    method: "DELETE",
   }),
   routeContext,
  );

  expect(response.status).toBe(200);
  expect(mocks.deleteLessonAnnotation).toHaveBeenCalledWith(authority, "user-1", annotationId);
 });
});
