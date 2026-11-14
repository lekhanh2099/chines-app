import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listReaderDocuments } = vi.hoisted(() => ({
 listReaderDocuments: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/reading/repositories/reading-content.repository", () => ({
 listReaderDocuments,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("GET /api/hanzihome/reader/documents", () => {
 beforeEach(() => {
  listReaderDocuments.mockReset();
 });

 it("serves the static catalog without an auth session", async () => {
  listReaderDocuments.mockResolvedValue([
   {
    id: "reader-1",
    kind: "core",
    slug: "reader-1",
   },
  ]);

  const response = await GET(new Request("https://app.example/api/hanzihome/reader/documents"));

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
   documents: [{ id: "reader-1", kind: "core", slug: "reader-1" }],
  });
 });

 it("does not mask an invalid static Reader package as a migration error", async () => {
  listReaderDocuments.mockRejectedValue(new Error("Static Reader JSON is invalid"));

  await expect(
   GET(new Request("https://app.example/api/hanzihome/reader/documents")),
  ).rejects.toThrow("Static Reader JSON is invalid");
 });

 it("returns the published Reader catalog", async () => {
  listReaderDocuments.mockResolvedValue([]);

  const response = await GET(new Request("https://app.example/api/hanzihome/reader/documents"));

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ documents: [] });
 });
});
