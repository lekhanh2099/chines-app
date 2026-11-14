import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/public", () => ({
 publicSupabaseEnv: {
  url: "https://example.supabase.co",
  key: "test-publishable-key",
 },
}));

const auth = vi.hoisted(() => ({
 requireAuthenticatedRoute: vi.fn(),
}));

const repository = vi.hoisted(() => ({
 deleteReaderAnnotation: vi.fn(),
 updateReaderAnnotation: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-route", async (importOriginal) => {
 const actual = await importOriginal<typeof import("@/lib/api/authenticated-route")>();
 return {
  ...actual,
  requireAuthenticatedRoute: auth.requireAuthenticatedRoute,
 };
});

vi.mock("@/features/reading/repositories/reading-annotation.repository", () => ({
 deleteReaderAnnotation: repository.deleteReaderAnnotation,
 updateReaderAnnotation: repository.updateReaderAnnotation,
}));

import { DELETE, PATCH } from "./route";

describe("/api/reading/annotations/[annotationId] owner guard", () => {
 const context = { user: { id: "user-a" }, supabase: {} };
 const routeContext = { params: Promise.resolve({ annotationId: "annotation-1" }) };

 beforeEach(() => {
  vi.clearAllMocks();
  auth.requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context });
  repository.deleteReaderAnnotation.mockResolvedValue(true);
 });

 it("rejects a stale owner before validating or updating an annotation", async () => {
  const response = await PATCH(
   new Request("https://app.example/api/reading/annotations/annotation-1", {
    method: "PATCH",
    headers: { "X-HanziHome-Owner-Id": "user-b" },
   }),
   routeContext,
  );

  expect(response.status).toBe(412);
  await expect(response.json()).resolves.toMatchObject({ code: "AUTH_OWNER_MISMATCH" });
  expect(repository.updateReaderAnnotation).not.toHaveBeenCalled();
 });

 it("deletes through the authenticated owner when the expected owner matches", async () => {
  const response = await DELETE(
   new Request("https://app.example/api/reading/annotations/annotation-1", {
    method: "DELETE",
    headers: {
     "Content-Type": "application/json",
     "X-HanziHome-Owner-Id": "user-a",
    },
    body: JSON.stringify({ expectedRevision: 1 }),
   }),
   routeContext,
  );

  expect(response.status).toBe(200);
  expect(repository.deleteReaderAnnotation).toHaveBeenCalledWith(
   { annotationId: "annotation-1", expectedRevision: 1 },
   context,
  );
 });
});
