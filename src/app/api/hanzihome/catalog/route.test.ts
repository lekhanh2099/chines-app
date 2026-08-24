import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
 getCatalogSummary,
 getCourseLessonSummaries,
 getStaticStudioCourseCatalog,
 requireAuthenticatedRoute,
} = vi.hoisted(() => ({
 getCatalogSummary: vi.fn(),
 getCourseLessonSummaries: vi.fn(),
 getStaticStudioCourseCatalog: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/repositories/hanzihome-content-repository", () => ({
 hanzihomeContentRepository: { getCatalogSummary, getCourseLessonSummaries },
}));
vi.mock("@/features/hanzihome/static-json/studio-static-content", () => ({
 getStaticStudioCourseCatalog,
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
  getStaticStudioCourseCatalog.mockReset();
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
  getCatalogSummary.mockResolvedValue({ source: "db", courses: [], books: [], lessons: [] });

  const response = await GET(new Request("https://app.example/api/hanzihome/catalog"));

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const payload = await response.json();
  expect(payload.catalog.source).toBe("db");
  expect(payload.catalog.courses).toEqual([]);
  expect(payload.catalog.books).toEqual([]);
  expect(payload.catalog.lessons).toEqual([]);
  expect(getCatalogSummary).toHaveBeenCalledWith({ includeLessons: false, includeRadicals: false });
  expect(getCourseLessonSummaries).not.toHaveBeenCalled();
 });

 it("includes the bundled HSK grammar course in the catalog", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getCatalogSummary.mockResolvedValue({
   source: "db",
   courses: [],
   books: [],
   lessons: [],
   radicals: [],
   meta: {
    app: "hanzihome",
    dataset: "catalog",
    version: "1",
    generatedAt: "2026-08-23T00:00:00.000Z",
    sourceFiles: [],
    counts: { lessons: 0, vocab: 0, grammarPoints: 0, radicals: 0, flashcards: 0 },
   },
  });
  getStaticStudioCourseCatalog.mockReturnValue({
   course: {
    id: "hanzihome-studio-grammar",
    slug: "hanzihome-studio-grammar",
    title: "Hanzi Studio Grammar",
    type: "grammar",
    order: 901,
    stats: { bookCount: 6, lessonCount: 6, vocabCount: 0, grammarCount: 577 },
   },
   books: [{ id: "hanzihome-studio-grammar:book:HSK1", courseId: "hanzihome-studio-grammar" }],
   lessons: [{ id: "hanzihome-studio-grammar:lesson:HSK1", courseId: "hanzihome-studio-grammar" }],
  });

  const response = await GET(new Request("https://app.example/api/hanzihome/catalog"));

  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(payload.catalog.courses).toEqual([
   expect.objectContaining({
    id: "hanzihome-studio-grammar",
    stats: expect.objectContaining({ grammarCount: 577 }),
   }),
  ]);
  expect(payload.catalog.books).toEqual([
   expect.objectContaining({ id: "hanzihome-studio-grammar:book:HSK1" }),
  ]);
  expect(payload.catalog.meta.counts).toMatchObject({ lessons: 6, grammarPoints: 577 });
 });

 it("loads lightweight lesson summaries in the single catalog request when requested", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getCatalogSummary.mockResolvedValue({ source: "db", courses: [], books: [], lessons: [] });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/catalog?includeLessons=1"),
  );

  expect(response.status).toBe(200);
  expect(getCatalogSummary).toHaveBeenCalledWith({ includeLessons: true, includeRadicals: false });
  const payload = await response.json();
  expect(payload.catalog.courses).toEqual([]);
  expect(payload.catalog.books).toEqual([]);
  expect(payload.catalog.lessons).toEqual([]);
  expect(getCourseLessonSummaries).not.toHaveBeenCalled();
 });

 it("serves bundled HSK grammar lessons without querying Supabase", async () => {
  getStaticStudioCourseCatalog.mockReturnValue({
   lessons: [{ id: "hanzihome-studio-grammar:lesson:HSK1" }],
  });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/catalog?courseId=hanzihome-studio-grammar"),
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
   lessons: [{ id: "hanzihome-studio-grammar:lesson:HSK1" }],
  });
  expect(requireAuthenticatedRoute).not.toHaveBeenCalled();
  expect(getCourseLessonSummaries).not.toHaveBeenCalled();
 });

 it("does not expose unrelated Studio static lessons through the canonical catalog", async () => {
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: new Response(null, { status: 401 }),
  });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/catalog?courseId=hanzihome-studio-dictation"),
  );

  expect(response.status).toBe(401);
  expect(requireAuthenticatedRoute).toHaveBeenCalledOnce();
  expect(getCourseLessonSummaries).not.toHaveBeenCalled();
 });

 it("loads radicals only when the radicals module requests them", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getCatalogSummary.mockResolvedValue({
   source: "db",
   courses: [],
   books: [],
   lessons: [],
   radicals: [],
  });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/catalog?includeRadicals=1"),
  );

  expect(response.status).toBe(200);
  expect(getCatalogSummary).toHaveBeenCalledWith({ includeLessons: false, includeRadicals: true });
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
