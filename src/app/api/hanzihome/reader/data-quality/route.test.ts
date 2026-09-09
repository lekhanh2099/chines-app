import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getReaderDataQualityReport, hasHanziHomeContentCapability, requireAuthenticatedRoute } =
 vi.hoisted(() => ({
  getReaderDataQualityReport: vi.fn(),
  hasHanziHomeContentCapability: vi.fn(),
  requireAuthenticatedRoute: vi.fn(),
 }));

vi.mock("server-only", () => ({}));
vi.mock("@/features/reading/repositories/reading-data-quality.repository", () => ({
 getReaderDataQualityReport,
}));
vi.mock("@/features/hanzihome/server/content-capability", () => ({
 hasHanziHomeContentCapability,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("/api/hanzihome/reader/data-quality", () => {
 beforeEach(() => {
  getReaderDataQualityReport.mockReset();
  hasHanziHomeContentCapability.mockReset();
  requireAuthenticatedRoute.mockReset();
  hasHanziHomeContentCapability.mockResolvedValue(true);
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: {}, user: { id: "user-1" } },
  });
 });

 it("requires the signed-in HanziHome session", async () => {
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const response = await GET();

  expect(response.status).toBe(401);
  expect(getReaderDataQualityReport).not.toHaveBeenCalled();
 });

 it("requires the HanziHome editor or admin capability", async () => {
  hasHanziHomeContentCapability.mockResolvedValue(false);

  const response = await GET();

  expect(response.status).toBe(403);
  expect(getReaderDataQualityReport).not.toHaveBeenCalled();
  await expect(response.json()).resolves.toEqual({
   error: "Forbidden",
   code: "HANZIHOME_CONTENT_ROLE_REQUIRED",
  });
 });

 it("returns the typed runtime audit report", async () => {
  getReaderDataQualityReport.mockResolvedValue({
   documents: 1,
   paragraphs: 2,
   vocabularyLinks: 3,
   exerciseGroups: 1,
   exerciseItems: 4,
   assets: 1,
   orphanParagraphs: 0,
   orphanVocabularyLinks: 0,
   orphanExerciseGroups: 0,
   orphanExerciseItems: 0,
   orphanAssets: 0,
   publishedKinds: [{ kind: "daily", count: 1 }],
   issues: [],
  });

  const response = await GET();

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
   documents: 1,
   publishedKinds: [{ kind: "daily" }],
  });
 });
});
