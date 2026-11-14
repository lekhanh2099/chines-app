import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HanziHomeData } from "@/features/hanzihome/types";
import { HanziHomeSearchIndexResponseSchema } from "@/features/hanzihome/search/types";
import type { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import {
 apiError,
 type AuthenticatedRouteContext,
 type requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import type { Database } from "@/types/supabase.generated";

const boundary = vi.hoisted(() => ({
 getSearchData: vi.fn<typeof hanzihomeContentRepository.getSearchData>(),
 authenticate: vi.fn<typeof requireAuthenticatedRoute>(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/repositories/hanzihome-content-repository", () => ({
 hanzihomeContentRepository: { getSearchData: boundary.getSearchData },
}));
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
   titleZh: "编辑可见",
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

describe("GET /api/hanzihome/search-index cache", () => {
 beforeEach(() => {
  vi.resetModules();
  boundary.getSearchData.mockReset();
  boundary.authenticate.mockReset();
 });
 afterEach(() => vi.useRealTimers());

 it("reuses only the authenticated owner's index and checks auth even on a warm cache", async () => {
  const { GET } = await import("./route");
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextA });
  boundary.getSearchData.mockResolvedValueOnce(dataA).mockResolvedValueOnce(dataB);
  const first = await GET();
  expect(first.headers.get("Cache-Control")).toBe("private, no-store");
  const payloadA = HanziHomeSearchIndexResponseSchema.parse(await first.json());
  expect(payloadA.items.some((item) => item.lessonId === "editor-visible-lesson")).toBe(true);
  await GET();
  expect(boundary.getSearchData).toHaveBeenCalledTimes(1);
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextB });
  const responseB = await GET();
  const payloadB = HanziHomeSearchIndexResponseSchema.parse(await responseB.json());
  expect(payloadB.items.some((item) => item.lessonId === "editor-visible-lesson")).toBe(false);
  expect(boundary.getSearchData).toHaveBeenCalledTimes(2);
  boundary.authenticate.mockResolvedValue({
   authenticated: false,
   response: apiError("Unauthorized", 401, "UNAUTHORIZED"),
  });
  expect((await GET()).status).toBe(401);
  expect(boundary.getSearchData).toHaveBeenCalledTimes(2);
 });

 it("expires after the existing five-minute TTL", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(0);
  const { GET } = await import("./route");
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextA });
  boundary.getSearchData.mockResolvedValueOnce(dataA).mockResolvedValueOnce(dataB);
  await GET();
  vi.setSystemTime(5 * 60 * 1000 - 1);
  await GET();
  expect(boundary.getSearchData).toHaveBeenCalledTimes(1);
  vi.setSystemTime(5 * 60 * 1000);
  const expired = HanziHomeSearchIndexResponseSchema.parse(await (await GET()).json());
  expect(expired.items.some((item) => item.lessonId === "editor-visible-lesson")).toBe(false);
  expect(boundary.getSearchData).toHaveBeenCalledTimes(2);
 });

 it("returns a redacted503 for another owner's failure without serving the previous index", async () => {
  const { GET } = await import("./route");
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextA });
  boundary.getSearchData.mockResolvedValueOnce(dataA);
  await GET();
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextB });
  boundary.getSearchData.mockRejectedValueOnce(new Error("private database failure"));
  const response = await GET();
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toEqual({
   error: "Could not load search index",
   code: "SEARCH_INDEX_UNAVAILABLE",
  });
  boundary.getSearchData.mockResolvedValueOnce(dataB);
  expect((await GET()).status).toBe(200);
 });

 it("does not expose a late A completion to a subsequent B request", async () => {
  const { GET } = await import("./route");
  let releaseA: (data: HanziHomeData) => void = () => {};
  boundary.getSearchData.mockImplementationOnce(
   () =>
    new Promise<HanziHomeData>((resolve) => {
     releaseA = resolve;
    }),
  );
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextA });
  const pendingA = GET();
  await vi.waitFor(() => expect(boundary.getSearchData).toHaveBeenCalledTimes(1));
  boundary.authenticate.mockResolvedValue({ authenticated: true, context: contextB });
  boundary.getSearchData.mockResolvedValueOnce(dataB);
  await GET();
  releaseA(dataA);
  await pendingA;
  boundary.getSearchData.mockResolvedValueOnce(dataB);
  const response = HanziHomeSearchIndexResponseSchema.parse(await (await GET()).json());
  expect(response.items.some((item) => item.lessonId === "editor-visible-lesson")).toBe(false);
  expect(boundary.getSearchData).toHaveBeenCalledTimes(3);
 });
});
