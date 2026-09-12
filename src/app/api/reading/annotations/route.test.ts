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
 createReaderAnnotation: vi.fn(),
 listReaderAnnotations: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-route", async (importOriginal) => {
 const actual = await importOriginal<typeof import("@/lib/api/authenticated-route")>();
 return {
  ...actual,
  requireAuthenticatedRoute: auth.requireAuthenticatedRoute,
 };
});

vi.mock("@/features/reading/repositories/reading-annotation.repository", () => ({
 createReaderAnnotation: repository.createReaderAnnotation,
 listReaderAnnotations: repository.listReaderAnnotations,
}));

import { GET, POST } from "./route";

describe("/api/reading/annotations owner guard", () => {
 const context = { user: { id: "user-a" }, supabase: {} };

 beforeEach(() => {
  vi.clearAllMocks();
  auth.requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context });
  repository.listReaderAnnotations.mockResolvedValue([]);
 });

 it("rejects a stale owner before reading annotations", async () => {
  const response = await GET(
   new Request("https://app.example/api/reading/annotations?documentId=reader-1", {
    headers: { "X-HanziHome-Owner-Id": "user-b" },
   }),
  );

  expect(response.status).toBe(412);
  await expect(response.json()).resolves.toMatchObject({ code: "AUTH_OWNER_MISMATCH" });
  expect(repository.listReaderAnnotations).not.toHaveBeenCalled();
 });

 it("uses the authenticated owner when the expected owner matches", async () => {
  const response = await GET(
   new Request("https://app.example/api/reading/annotations?documentId=reader-1", {
    headers: { "X-HanziHome-Owner-Id": "user-a" },
   }),
  );

  expect(response.status).toBe(200);
  expect(repository.listReaderAnnotations).toHaveBeenCalledWith("reader-1", context);
 });

 it("rejects a stale owner before validating or creating an annotation", async () => {
  const response = await POST(
   new Request("https://app.example/api/reading/annotations", {
    method: "POST",
    headers: { "X-HanziHome-Owner-Id": "user-b" },
   }),
  );

  expect(response.status).toBe(412);
  expect(repository.createReaderAnnotation).not.toHaveBeenCalled();
 });
});
