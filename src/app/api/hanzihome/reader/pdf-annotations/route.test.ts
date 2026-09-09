import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPdfAnnotation, savePdfAnnotation, requireAuthenticatedRoute } = vi.hoisted(() => ({
 getPdfAnnotation: vi.fn(),
 savePdfAnnotation: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/reading/pdf/pdf-annotation-repository", () => ({
 getPdfAnnotation,
 savePdfAnnotation,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET, PUT } from "./route";

describe("/api/hanzihome/reader/pdf-annotations", () => {
 beforeEach(() => {
  getPdfAnnotation.mockReset();
  savePdfAnnotation.mockReset();
  requireAuthenticatedRoute.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
 });

 it("validates the page query before reading", async () => {
  const response = await GET(
   new Request(
    "https://app.example/api/hanzihome/reader/pdf-annotations?assetId=asset-1&pageNumber=0",
   ),
  );

  expect(response.status).toBe(400);
  expect(getPdfAnnotation).not.toHaveBeenCalled();
 });

 it("loads the authenticated user's page annotation", async () => {
  getPdfAnnotation.mockResolvedValue(null);

  const response = await GET(
   new Request(
    "https://app.example/api/hanzihome/reader/pdf-annotations?assetId=asset-1&pageNumber=3",
   ),
  );

  expect(response.status).toBe(200);
  expect(getPdfAnnotation).toHaveBeenCalledWith({ assetId: "asset-1", pageNumber: 3 }, {});
  await expect(response.json()).resolves.toEqual({ annotation: null });
 });

 it("rejects malformed strokes before reaching Supabase", async () => {
  const response = await PUT(
   new Request("https://app.example/api/hanzihome/reader/pdf-annotations", {
    method: "PUT",
    body: JSON.stringify({
     assetId: "asset-1",
     pageNumber: 3,
     payload: { strokes: [{ id: "broken" }] },
     expectedRevision: 0,
    }),
   }),
  );

  expect(response.status).toBe(400);
  expect(savePdfAnnotation).not.toHaveBeenCalled();
 });
});
