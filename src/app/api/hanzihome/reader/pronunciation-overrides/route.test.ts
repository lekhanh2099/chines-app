import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
 deleteReaderPronunciationOverride,
 listReaderPronunciationOverrides,
 saveReaderPronunciationOverride,
 requireAuthenticatedRoute,
} = vi.hoisted(() => ({
 deleteReaderPronunciationOverride: vi.fn(),
 listReaderPronunciationOverrides: vi.fn(),
 saveReaderPronunciationOverride: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/reading/repositories/reading-pronunciation.repository", () => ({
 deleteReaderPronunciationOverride,
 listReaderPronunciationOverrides,
 saveReaderPronunciationOverride,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { DELETE, GET, PUT } from "./route";

describe("/api/hanzihome/reader/pronunciation-overrides", () => {
 beforeEach(() => {
  deleteReaderPronunciationOverride.mockReset();
  listReaderPronunciationOverrides.mockReset();
  saveReaderPronunciationOverride.mockReset();
  requireAuthenticatedRoute.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
 });

 it("validates the document query before reading", async () => {
  const response = await GET(
   new Request("https://app.example/api/hanzihome/reader/pronunciation-overrides"),
  );
  expect(response.status).toBe(400);
  expect(listReaderPronunciationOverrides).not.toHaveBeenCalled();
 });

 it("loads the authenticated user's overrides for one document", async () => {
  listReaderPronunciationOverrides.mockResolvedValue([]);
  const response = await GET(
   new Request(
    "https://app.example/api/hanzihome/reader/pronunciation-overrides?documentId=reader-1",
   ),
  );
  expect(response.status).toBe(200);
  expect(listReaderPronunciationOverrides).toHaveBeenCalledWith("reader-1", {});
  await expect(response.json()).resolves.toEqual({ overrides: [] });
 });

 it("rejects invalid readings before reaching Supabase", async () => {
  const response = await PUT(
   new Request("https://app.example/api/hanzihome/reader/pronunciation-overrides", {
    method: "PUT",
    body: JSON.stringify({
     id: "00000000-0000-4000-8000-000000000001",
     documentId: "reader-1",
     paragraphId: "paragraph-1",
     text: "行",
     readings: ["not-pinyin"],
     scope: "sentence-instance",
     sentenceText: "行",
     startOffset: 0,
     endOffset: 1,
     expectedRevision: 0,
    }),
   }),
  );
  expect(response.status).toBe(400);
  expect(saveReaderPronunciationOverride).not.toHaveBeenCalled();
 });

 it("deletes with optimistic revision", async () => {
  deleteReaderPronunciationOverride.mockResolvedValue(true);
  const response = await DELETE(
   new Request("https://app.example/api/hanzihome/reader/pronunciation-overrides", {
    method: "DELETE",
    body: JSON.stringify({
     id: "00000000-0000-4000-8000-000000000001",
     expectedRevision: 2,
    }),
   }),
  );
  expect(response.status).toBe(200);
  expect(deleteReaderPronunciationOverride).toHaveBeenCalledWith(
   {
    id: "00000000-0000-4000-8000-000000000001",
    expectedRevision: 2,
   },
   {},
  );
 });
});
