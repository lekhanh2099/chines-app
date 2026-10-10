import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
 getPdfAnnotation,
 savePdfAnnotation,
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner,
} = vi.hoisted(() => ({
 getPdfAnnotation: vi.fn(),
 savePdfAnnotation: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
 verifyExpectedAuthenticatedOwner: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/reading/pdf/pdf-annotation-repository", () => ({
 getPdfAnnotation,
 savePdfAnnotation,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue, init?: Omit<ResponseInit, "headers">) =>
  Response.json(body, { ...init, headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET, PUT } from "./route";

describe("/api/hanzihome/reader/pdf-annotations", () => {
 beforeEach(() => {
  verifyExpectedAuthenticatedOwner.mockReset();
  verifyExpectedAuthenticatedOwner.mockReturnValue(null);
  getPdfAnnotation.mockReset();
  savePdfAnnotation.mockReset();
  requireAuthenticatedRoute.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
 });

 it("rejects an account switch before reading or writing", async () => {
  verifyExpectedAuthenticatedOwner.mockReturnValue(
   Response.json({ code: "AUTH_OWNER_MISMATCH" }, { status: 412 }),
  );
  const request = new Request("https://app.example/api/reading/pdf/annotations", {
   method: "PUT",
   headers: { "X-HanziHome-Owner-Id": "old-owner" },
  });
  expect((await PUT(request)).status).toBe(412);
  expect((await GET(new Request(request.url))).status).toBe(412);
  expect(savePdfAnnotation).not.toHaveBeenCalled();
  expect(getPdfAnnotation).not.toHaveBeenCalled();
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
     expectedAbsent: true,
    }),
   }),
  );

  expect(response.status).toBe(400);
  expect(savePdfAnnotation).not.toHaveBeenCalled();
 });
 it("rejects a legacy write without the observed absence base", async () => {
  const response = await PUT(
   new Request("https://app.example/api/reading/pdf/annotations", {
    method: "PUT",
    body: JSON.stringify({
     assetId: "asset-1",
     pageNumber: 1,
     payload: { strokes: [] },
     expectedRevision: 0,
    }),
   }),
  );
  expect(response.status).toBe(400);
  expect(savePdfAnnotation).not.toHaveBeenCalled();
 });
 it("returns the locked conflict snapshot with private no-store semantics", async () => {
  savePdfAnnotation.mockResolvedValue({ saved: false, annotation: null });
  const payload = {
   assetId: "asset-1",
   pageNumber: 1,
   payload: { strokes: [] },
   expectedRevision: 0,
   expectedAbsent: false,
  };
  const response = await PUT(
   new Request("https://app.example/api/reading/pdf/annotations", {
    method: "PUT",
    body: JSON.stringify(payload),
   }),
  );
  expect(response.status).toBe(409);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ annotation: null });
  expect(savePdfAnnotation).toHaveBeenCalledWith(payload, {});
 });
 it("returns unavailability instead of pretending transport failure is a version conflict", async () => {
  savePdfAnnotation.mockRejectedValue(new Error("DB unavailable"));
  const response = await PUT(
   new Request("https://app.example/api/reading/pdf/annotations", {
    method: "PUT",
    body: JSON.stringify({
     assetId: "asset-1",
     pageNumber: 1,
     payload: { strokes: [] },
     expectedRevision: 0,
     expectedAbsent: true,
    }),
   }),
  );
  expect(response.status).toBe(503);
 });
});
