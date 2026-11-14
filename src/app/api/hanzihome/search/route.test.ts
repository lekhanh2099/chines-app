import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import { HanziHomeSearchResponseSchema } from "@/features/hanzihome/search/types";
import type { HanziHomeData } from "@/features/hanzihome/types";
import {
 apiError,
 type AuthenticatedRouteContext,
 type requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import type { getUserNotesForSearch } from "@/services/notes/notes.service";
import type { Database } from "@/types/supabase.generated";

const boundary = vi.hoisted(() => ({
 getSearchData: vi.fn<typeof hanzihomeContentRepository.getSearchData>(),
 getNotes: vi.fn<typeof getUserNotesForSearch>(),
 authenticate: vi.fn<typeof requireAuthenticatedRoute>(),
}));
// Each test re-imports the route, which rebuilds the static corpus index (~3 s).
vi.setConfig({ testTimeout: 30_000 });
vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/repositories/hanzihome-content-repository", () => ({
 hanzihomeContentRepository: { getSearchData: boundary.getSearchData },
}));
vi.mock("@/services/notes/notes.service", () => ({ getUserNotesForSearch: boundary.getNotes }));
vi.mock("@/lib/api/authenticated-route", async (importOriginal) => ({
 ...(await importOriginal<typeof import("@/lib/api/authenticated-route")>()),
 requireAuthenticatedRoute: boundary.authenticate,
}));

const contextA: AuthenticatedRouteContext = {
 supabase: createClient<Database>("https://example.supabase.co", "fixture-key", {
  auth: { persistSession: false, autoRefreshToken: false },
 }),
 user: {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-08T00:00:00Z",
 },
};
const contextB: AuthenticatedRouteContext = {
 ...contextA,
 user: { ...contextA.user, id: "00000000-0000-4000-8000-000000000002" },
};
const dataA: HanziHomeData = {
 courses: [],
 books: [],
 lessons: [
  {
   id: "editor-visible-lesson",
   titleZh: "编辑可见团聚",
   title: "Editor-visible fixture",
   lessonNumber: 1,
   vocabIds: [],
   grammarPointIds: [],
   vocab: [],
   grammar: [],
  },
 ],
 radicals: [],
 meta: {
  app: "hanzihome",
  dataset: "fixture",
  version: "1",
  generatedAt: "",
  sourceFiles: [],
  counts: { lessons: 1, vocab: 0, grammarPoints: 0, radicals: 0, flashcards: 0 },
 },
};
const dataB: HanziHomeData = {
 ...dataA,
 lessons: [],
 meta: { ...dataA.meta, counts: { ...dataA.meta.counts, lessons: 0 } },
};
const noteA = {
 id: "note-a",
 title: "Nhật ký Tết",
 tags: [],
 updated_at: "2026-11-01T00:00:00Z",
 content: {
  root: { children: [{ type: "paragraph", children: [{ type: "text", text: "一家人团聚" }] }] },
 },
};

function request(query: string) {
 return new Request(`http://localhost/api/hanzihome/search?${query}`);
}

async function ids(response: Response) {
 const payload = HanziHomeSearchResponseSchema.parse(await response.json());
 return payload.results.map((result) => result.item.id);
}

describe("GET /api/hanzihome/search", () => {
 // The first import transforms the static corpus JSON; later imports reuse the transform.
 beforeAll(async () => {
  await import("./route");
 }, 60_000);
 beforeEach(() => {
  vi.resetModules();
  boundary.getSearchData.mockReset();
  boundary.getNotes.mockReset();
  boundary.authenticate.mockReset();
  boundary.getNotes.mockResolvedValue([]);
 });
 afterEach(() => vi.useRealTimers());

 it("rejects a guest before reading any content", async () => {
  const { GET } = await import("./route");
  boundary.authenticate.mockResolvedValue({
   authenticated: false,
   response: apiError("Unauthorized", 401, "UNAUTHORIZED"),
  });
  expect((await GET(request("q=%E5%9B%A2%E8%81%9A"))).status).toBe(401);
  expect(boundary.getSearchData).not.toHaveBeenCalled();
  expect(boundary.getNotes).not.toHaveBeenCalled();
 });

 it.each(["", "q=%20", "q=a&category=unknown", "q=a&limit=0", "q=a&limit=61", "q=a&limit=x"])(
  "rejects invalid parameters %s",
  async (query) => {
   const { GET } = await import("./route");
   boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextA });
   const response = await GET(request(query));
   expect(response.status).toBe(400);
   await expect(response.json()).resolves.toEqual({
    error: "Invalid search request",
    code: "INVALID_SEARCH_REQUEST",
   });
   expect(boundary.getSearchData).not.toHaveBeenCalled();
  },
 );

 it("returns ranked course, textbook and note results with category counts", async () => {
  const { GET } = await import("./route");
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextA });
  boundary.getSearchData.mockResolvedValue(dataA);
  boundary.getNotes.mockResolvedValue([noteA]);
  const response = await GET(request("q=%E5%9B%A2%E8%81%9A&limit=60"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const payload = HanziHomeSearchResponseSchema.parse(await response.json());
  const resultIds = payload.results.map((result) => result.item.id);
  expect(payload.query).toBe("团聚");
  expect(payload.category).toBe("all");
  expect(payload.results.length).toBeLessThanOrEqual(60);
  expect(resultIds).toContain("note:note-a");
  expect(resultIds.some((id) => id.startsWith("navigation:editor-visible-lesson"))).toBe(true);
  expect(resultIds.some((id) => id.startsWith("textbook-"))).toBe(true);
  expect(payload.counts.all).toBeGreaterThanOrEqual(payload.results.length);
  expect(payload.counts.note).toBe(1);
  expect(boundary.getNotes).toHaveBeenCalledWith(contextA.supabase, contextA.user.id, 300);

  const notesOnly = HanziHomeSearchResponseSchema.parse(
   await (await GET(request("q=%E5%9B%A2%E8%81%9A&category=note"))).json(),
  );
  expect(notesOnly.results.map((result) => result.item.id)).toEqual(["note:note-a"]);
  expect(notesOnly.counts).toEqual(payload.counts);
 });

 it("caches course content per owner, reads notes live and expires on the TTL", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(0);
  const { GET } = await import("./route");
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextA });
  boundary.getSearchData.mockResolvedValueOnce(dataA).mockResolvedValueOnce(dataB);
  const query = "q=%E7%BC%96%E8%BE%91";
  expect((await ids(await GET(request(query)))).length).toBeGreaterThan(0);
  vi.setSystemTime(5 * 60 * 1000 - 1);
  expect((await ids(await GET(request(query)))).length).toBeGreaterThan(0);
  expect(boundary.getSearchData).toHaveBeenCalledTimes(1);
  expect(boundary.getNotes).toHaveBeenCalledTimes(2);

  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextB });
  boundary.getSearchData.mockResolvedValueOnce(dataB);
  expect(await ids(await GET(request(query)))).toEqual([]);
  expect(boundary.getSearchData).toHaveBeenCalledTimes(2);

  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextA });
  boundary.getSearchData.mockResolvedValueOnce(dataB);
  vi.setSystemTime(5 * 60 * 1000);
  expect(await ids(await GET(request(query)))).toEqual([]);
  expect(boundary.getSearchData).toHaveBeenCalledTimes(3);
 });

 it("returns a redacted 503 without serving another owner's cached courses", async () => {
  const { GET } = await import("./route");
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextA });
  boundary.getSearchData.mockResolvedValueOnce(dataA);
  await GET(request("q=a"));
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextB });
  boundary.getSearchData.mockRejectedValueOnce(new Error("private database failure"));
  const response = await GET(request("q=a"));
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toEqual({
   error: "Could not search HanziHome",
   code: "SEARCH_UNAVAILABLE",
  });
  boundary.getNotes.mockRejectedValueOnce(new Error("private notes failure"));
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextA });
  expect((await GET(request("q=a"))).status).toBe(503);
 });
});
