import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAggregateItems, requireAuthenticatedRoute } = vi.hoisted(() => ({
 getAggregateItems: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/repositories/hanzihome-content-repository", () => ({
 hanzihomeContentRepository: { getAggregateItems },
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("GET /api/hanzihome/aggregate/:kind", () => {
 beforeEach(() => {
  getAggregateItems.mockReset();
  requireAuthenticatedRoute.mockReset();
 });

 it("serves the bundled Studio grammar aggregate without querying Supabase", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });

  const response = await GET(
   new Request("https://app.example/api?courseId=hanzihome-studio-grammar&bookId=&lessonId=&q="),
   { params: Promise.resolve({ kind: "grammar" }) },
  );

  expect(response.status).toBe(200);
  expect(requireAuthenticatedRoute).not.toHaveBeenCalled();
  expect(getAggregateItems).not.toHaveBeenCalled();
  const payload = await response.json();
  expect(payload.items).toHaveLength(577);
 });

 it("merges unscoped canonical and bundled Studio aggregates", async () => {
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
  getAggregateItems.mockResolvedValue([
   {
    id: "canonical-vocab-1",
    courseId: "canonical-course",
    bookId: "canonical-book",
    lessonId: "canonical-lesson",
    lessonNumber: 1,
    lessonOrder: 1,
    lessonTitle: "Canonical",
    word: "你好",
    pinyin: "nǐ hǎo",
    hanViet: "nhĩ hảo",
    meaning: "xin chào",
    category: "greeting",
    level: null,
    pos: { vi: null, zh: null },
   },
  ]);

  const response = await GET(new Request("https://app.example/api"), {
   params: Promise.resolve({ kind: "vocab" }),
  });

  expect(response.status).toBe(200);
  expect(getAggregateItems).toHaveBeenCalledWith({
   kind: "vocab",
   filters: { courseId: "", bookId: "", lessonId: "", q: "" },
  });
  const payload = await response.json();
  expect(payload.items).toHaveLength(355);
  expect(payload.items[0].id).toBe("canonical-vocab-1");
  expect(
   payload.items.some((item: { id: string }) => item.id.startsWith("hanzihome-studio-")),
  ).toBe(true);
 });
});
