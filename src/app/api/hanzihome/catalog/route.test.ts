import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRadicals, getStaticStudioCourseCatalog, requireAuthenticatedRoute } = vi.hoisted(() => ({
 getRadicals: vi.fn(),
 getStaticStudioCourseCatalog: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/repositories/hanzihome-content-repository", () => ({
 hanzihomeContentRepository: { getRadicals },
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

const grammarCourse = {
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
};

describe("GET /api/hanzihome/catalog", () => {
 beforeEach(() => {
  getRadicals.mockReset();
  getStaticStudioCourseCatalog.mockReset();
  requireAuthenticatedRoute.mockReset();
  getStaticStudioCourseCatalog.mockReturnValue(grammarCourse);
 });

 it("returns 401 without reading content when the session is missing", async () => {
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 }),
  });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/catalog?includeRadicals=1"),
  );

  expect(response.status).toBe(401);
  expect(getRadicals).not.toHaveBeenCalled();
 });

 it("returns the bundled HSK grammar course with private no-store caching", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });

  const response = await GET(new Request("https://app.example/api/hanzihome/catalog"));

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const payload = await response.json();
  expect(payload.catalog.source).toBe("static");
  expect(payload.catalog.courses).toEqual([
   expect.objectContaining({
    id: "hanzihome-studio-grammar",
    stats: expect.objectContaining({ grammarCount: 577 }),
   }),
  ]);
  expect(payload.catalog.books).toEqual([
   expect.objectContaining({ id: "hanzihome-studio-grammar:book:HSK1" }),
  ]);
  expect(payload.catalog.lessons).toEqual([]);
  expect(payload.catalog.radicals).toEqual([]);
  expect(payload.catalog.meta.counts).toMatchObject({ lessons: 6, grammarPoints: 577 });
  expect(getRadicals).not.toHaveBeenCalled();
 });

 it("includes lesson summaries in the single catalog request when requested", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/catalog?includeLessons=1"),
  );

  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(payload.catalog.lessons).toEqual([
   expect.objectContaining({ id: "hanzihome-studio-grammar:lesson:HSK1" }),
  ]);
 });

 it("serves bundled HSK grammar lessons without a session", async () => {
  const response = await GET(
   new Request("https://app.example/api/hanzihome/catalog?courseId=hanzihome-studio-grammar"),
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
   lessons: [expect.objectContaining({ id: "hanzihome-studio-grammar:lesson:HSK1" })],
  });
  expect(requireAuthenticatedRoute).not.toHaveBeenCalled();
 });

 it.each(["hanzihome-studio-dictation", "hanyu-q2"])(
  "answers not found for the lessons of %s, which the catalog does not serve",
  async (courseId) => {
   const response = await GET(
    new Request(`https://app.example/api/hanzihome/catalog?courseId=${courseId}`),
   );

   expect(response.status).toBe(404);
   await expect(response.json()).resolves.toEqual({
    error: "Course not found",
    code: "COURSE_NOT_FOUND",
   });
   expect(getStaticStudioCourseCatalog).not.toHaveBeenCalled();
  },
 );

 it("reads radicals from the database only when the radicals module requests them", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getRadicals.mockResolvedValue([{ id: "radical-1", index: 1, radical: "一" }]);

  const response = await GET(
   new Request("https://app.example/api/hanzihome/catalog?includeRadicals=1"),
  );

  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(payload.catalog.radicals).toEqual([expect.objectContaining({ id: "radical-1" })]);
  expect(payload.catalog.meta.counts.radicals).toBe(1);
  expect(getRadicals).toHaveBeenCalledOnce();
 });

 it("hides database error details from clients", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getRadicals.mockRejectedValue(new Error("password authentication failed for postgres"));

  const response = await GET(
   new Request("https://app.example/api/hanzihome/catalog?includeRadicals=1"),
  );

  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toEqual({
   error: "Could not load HanziHome catalog",
   code: "CATALOG_UNAVAILABLE",
  });
 });
});
