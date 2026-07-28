import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCatalogSummary, getCourseLessonSummaries, requireAuthenticatedRoute } = vi.hoisted(
 () => ({
  getCatalogSummary: vi.fn(),
  getCourseLessonSummaries: vi.fn(),
  requireAuthenticatedRoute: vi.fn(),
 }),
);

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/repositories/hanzihome-content-repository", () => ({
 hanzihomeContentRepository: { getCatalogSummary, getCourseLessonSummaries },
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("GET /api/hanzihome/catalog", () => {
 beforeEach(() => {
  getCatalogSummary.mockReset();
  getCourseLessonSummaries.mockReset();
  requireAuthenticatedRoute.mockReset();
 });

 it("returns 401 without querying content when the session is missing", async () => {
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 }),
  });

  const response = await GET(new Request("https://app.example/api/hanzihome/catalog"));

  expect(response.status).toBe(401);
  expect(getCatalogSummary).not.toHaveBeenCalled();
 });

 it("returns authenticated catalog data with private no-store caching", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getCatalogSummary.mockResolvedValue({ source: "db", courses: [] });

  const response = await GET(new Request("https://app.example/api/hanzihome/catalog"));

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({
   catalog: { source: "db", courses: [] },
  });
  expect(getCatalogSummary).toHaveBeenCalledWith({ includeLessons: false });
  expect(getCourseLessonSummaries).not.toHaveBeenCalled();
 });

 it("loads lightweight lesson summaries in the single catalog request when requested", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getCatalogSummary.mockResolvedValue({ source: "db", courses: [], lessons: [] });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/catalog?includeLessons=1"),
  );

  expect(response.status).toBe(200);
  expect(getCatalogSummary).toHaveBeenCalledWith({ includeLessons: true });
  expect(getCourseLessonSummaries).not.toHaveBeenCalled();
 });

 it("hides database error details from clients", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getCatalogSummary.mockRejectedValue(new Error("password authentication failed for postgres"));

  const response = await GET(new Request("https://app.example/api/hanzihome/catalog"));

  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toEqual({
   error: "Could not load HanziHome catalog",
   code: "CATALOG_UNAVAILABLE",
  });
 });
});
