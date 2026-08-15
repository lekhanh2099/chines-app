import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getReaderProgress, saveReaderProgress, requireAuthenticatedRoute } = vi.hoisted(() => ({
 getReaderProgress: vi.fn(),
 saveReaderProgress: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/reader/reader-state-repository", () => ({
 getReaderProgress,
 saveReaderProgress,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET, PUT } from "./route";

describe("/api/hanzihome/reader/progress", () => {
 beforeEach(() => {
  getReaderProgress.mockReset();
  saveReaderProgress.mockReset();
  requireAuthenticatedRoute.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
 });

 it("requires a document id before loading progress", async () => {
  const response = await GET(new Request("https://app.example/api/hanzihome/reader/progress"));

  expect(response.status).toBe(400);
  expect(getReaderProgress).not.toHaveBeenCalled();
 });

 it("loads progress through the server repository", async () => {
  getReaderProgress.mockResolvedValue(null);

  const response = await GET(
   new Request("https://app.example/api/hanzihome/reader/progress?documentId=reader-1"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(getReaderProgress).toHaveBeenCalledWith("reader-1", {});
  await expect(response.json()).resolves.toEqual({ progress: null });
 });

 it("rejects malformed writes before reaching Supabase", async () => {
  const response = await PUT(
   new Request("https://app.example/api/hanzihome/reader/progress", {
    method: "PUT",
    body: JSON.stringify({ documentId: "reader-1", expectedRevision: 0 }),
   }),
  );

  expect(response.status).toBe(400);
  expect(saveReaderProgress).not.toHaveBeenCalled();
 });
});
