import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 deleteLessonAnnotation: vi.fn(),
 updateLessonAnnotationNote: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
 verifyExpectedAuthenticatedOwner: vi.fn(),
 createServiceRoleSupabaseClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/annotations/lesson-annotation-repository.server", () => ({
 deleteLessonAnnotation: mocks.deleteLessonAnnotation,
 updateLessonAnnotationNote: mocks.updateLessonAnnotationNote,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 expectedAuthenticatedOwnerHeader: "X-HanziHome-Owner-Id",
 verifyExpectedAuthenticatedOwner: mocks.verifyExpectedAuthenticatedOwner,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue, init?: Omit<ResponseInit, "headers">) =>
  Response.json(body, { ...init, headers: { "Cache-Control": "private, no-store" } }),
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
  mocks.verifyExpectedAuthenticatedOwner.mockReturnValue(null);
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context });
  mocks.createServiceRoleSupabaseClient.mockReturnValue(authority);
 });

 it("rejects an explicit stale owner on updates and deletes before privileged work", async () => {
  mocks.verifyExpectedAuthenticatedOwner.mockReturnValue(
   Response.json({ code: "AUTH_OWNER_MISMATCH" }, { status: 412 }),
  );
  const headers = { "X-HanziHome-Owner-Id": "old-owner" };
  const url = `https://app.example/api/hanzihome/lesson-annotations/${annotationId}`;
  const update = await PATCH(new Request(url, { method: "PATCH", headers }), routeContext);
  const remove = await DELETE(new Request(url, { method: "DELETE", headers }), routeContext);
  expect(update.status).toBe(412);
  expect(remove.status).toBe(412);
  expect(mocks.verifyExpectedAuthenticatedOwner).toHaveBeenCalledTimes(2);
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
  expect(mocks.updateLessonAnnotationNote).not.toHaveBeenCalled();
  expect(mocks.deleteLessonAnnotation).not.toHaveBeenCalled();
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

 it.each([false, true])(
  "updates with the authenticated owner and optional owner header: %s",
  async (withOwner) => {
   const headers = new Headers();
   if (withOwner) headers.set("X-HanziHome-Owner-Id", "user-1");
   const annotation = { id: annotationId };
   mocks.updateLessonAnnotationNote.mockResolvedValue({ saved: true, annotation });

   const response = await PATCH(
    new Request(`https://app.example/api/hanzihome/lesson-annotations/${annotationId}`, {
     method: "PATCH",
     headers,
     body: JSON.stringify({ noteText: "Ghi chú", expectedRevision: 7 }),
    }),
    routeContext,
   );

   expect(response.status).toBe(200);
   expect(mocks.verifyExpectedAuthenticatedOwner).toHaveBeenCalledTimes(withOwner ? 1 : 0);
   expect(mocks.updateLessonAnnotationNote).toHaveBeenCalledWith(authority, "user-1", {
    annotationId,
    noteText: "Ghi chú",
    expectedRevision: 7,
   });
  },
 );

 it.each([false, true])(
  "deletes with the server-derived owner and optional owner header: %s",
  async (withOwner) => {
   const headers = new Headers();
   if (withOwner) headers.set("X-HanziHome-Owner-Id", "user-1");
   mocks.deleteLessonAnnotation.mockResolvedValue(true);

   const response = await DELETE(
    new Request(`https://app.example/api/hanzihome/lesson-annotations/${annotationId}`, {
     method: "DELETE",
     headers,
    }),
    routeContext,
   );

   expect(response.status).toBe(200);
   expect(mocks.verifyExpectedAuthenticatedOwner).toHaveBeenCalledTimes(withOwner ? 1 : 0);
   expect(mocks.deleteLessonAnnotation).toHaveBeenCalledWith(authority, "user-1", annotationId);
  },
 );

 it("rejects legacy requests without an observed revision before privileged work", async () => {
  const response = await PATCH(
   new Request(`https://app.example/api/hanzihome/lesson-annotations/${annotationId}`, {
    method: "PATCH",
    body: JSON.stringify({ noteText: "Stale legacy client" }),
   }),
   routeContext,
  );
  expect(response.status).toBe(400);
  expect(mocks.createServiceRoleSupabaseClient).not.toHaveBeenCalled();
 });

 it("returns the locked server snapshot with 409 and no-store for a stale base", async () => {
  const result = {
   saved: false,
   annotation: { id: annotationId, note: { revision: 8, content: { text: "Server" } } },
  };
  mocks.updateLessonAnnotationNote.mockResolvedValue(result);
  const response = await PATCH(
   new Request(`https://app.example/api/hanzihome/lesson-annotations/${annotationId}`, {
    method: "PATCH",
    body: JSON.stringify({ noteText: "Local", expectedRevision: 7 }),
   }),
   routeContext,
  );
  expect(response.status).toBe(409);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual(result);
 });

 it("passes an explicit absence base for an annotation without a linked note", async () => {
  mocks.updateLessonAnnotationNote.mockResolvedValue({
   saved: true,
   annotation: { id: annotationId },
  });
  const response = await PATCH(
   new Request(`https://app.example/api/hanzihome/lesson-annotations/${annotationId}`, {
    method: "PATCH",
    body: JSON.stringify({ noteText: "First note", expectedRevision: null }),
   }),
   routeContext,
  );
  expect(response.status).toBe(200);
  expect(mocks.updateLessonAnnotationNote).toHaveBeenCalledWith(authority, "user-1", {
   annotationId,
   noteText: "First note",
   expectedRevision: null,
  });
 });
});
