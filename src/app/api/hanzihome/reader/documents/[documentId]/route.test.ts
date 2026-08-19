import { beforeEach, describe, expect, it, vi } from "vitest";

const { getReaderDocument } = vi.hoisted(() => ({
 getReaderDocument: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/reader/reader-content-repository", () => ({
 getReaderDocument,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: object) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("GET /api/hanzihome/reader/documents/[documentId]", () => {
 beforeEach(() => {
  getReaderDocument.mockReset();
 });

 it("serves a static Reader document without an auth session", async () => {
  getReaderDocument.mockResolvedValue({
   document: { id: "reader-1" },
   paragraphs: [{ id: "paragraph-1" }],
  });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/reader/documents/reader-1"),
   {
    params: Promise.resolve({ documentId: "reader-1" }),
   },
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
   document: { id: "reader-1" },
   paragraphs: [{ id: "paragraph-1" }],
  });
 });

 it("returns not found when the static document ID is absent", async () => {
  getReaderDocument.mockResolvedValue(null);

  const response = await GET(
   new Request("https://app.example/api/hanzihome/reader/documents/missing"),
   {
    params: Promise.resolve({ documentId: "missing" }),
   },
  );

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
   error: "Reader document not found",
   code: "READER_NOT_FOUND",
  });
 });
});
