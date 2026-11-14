import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getHomeLearningOverview, requireAuthenticatedRoute } = vi.hoisted(() => ({
 getHomeLearningOverview: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/home/home-learning-overview-repository.server", () => ({
 getHomeLearningOverview,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("/api/home/learning-overview", () => {
 beforeEach(() => {
  getHomeLearningOverview.mockReset();
  requireAuthenticatedRoute.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { user: { id: "user-1" }, supabase: {} },
  });
 });

 it("returns the authenticated learner's derived state summary", async () => {
  getHomeLearningOverview.mockResolvedValue({
   srsDueCount: 3,
   learningLoopDueCount: 2,
   readerCompletedCount: 4,
   readerDocumentCount: 8,
  });

  const response = await GET();

  expect(response.status).toBe(200);
  expect(getHomeLearningOverview).toHaveBeenCalledWith("user-1");
  await expect(response.json()).resolves.toEqual({
   overview: {
    srsDueCount: 3,
    learningLoopDueCount: 2,
    readerCompletedCount: 4,
    readerDocumentCount: 8,
   },
  });
 });

 it("keeps the route unavailable when the scoped read fails", async () => {
  getHomeLearningOverview.mockRejectedValue(new Error("database unavailable"));

  const response = await GET();

  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toEqual({
   error: "Could not load home learning overview",
   code: "HOME_OVERVIEW_UNAVAILABLE",
  });
 });
});
