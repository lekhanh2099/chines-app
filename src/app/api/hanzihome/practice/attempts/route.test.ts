import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
 countPracticeAttempts,
 listPracticeAttempts,
 listRecentPracticeAttempts,
 savePracticeAttempt,
 requireAuthenticatedRoute,
} = vi.hoisted(() => ({
 countPracticeAttempts: vi.fn(),
 listPracticeAttempts: vi.fn(),
 listRecentPracticeAttempts: vi.fn(),
 savePracticeAttempt: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/practice/practice-attempt-repository.server", () => ({
 countPracticeAttempts,
 listPracticeAttempts,
 listRecentPracticeAttempts,
 savePracticeAttempt,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET, POST } from "./route";

describe("/api/hanzihome/practice/attempts", () => {
 const authContext = { user: { id: "user-1" }, supabase: {} };

 beforeEach(() => {
  countPracticeAttempts.mockReset();
  listPracticeAttempts.mockReset();
  listRecentPracticeAttempts.mockReset();
  savePracticeAttempt.mockReset();
  requireAuthenticatedRoute.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: authContext });
 });

 it("loads history within the requested surface and content scope", async () => {
  listPracticeAttempts.mockResolvedValue([]);

  const response = await GET(
   new Request(
    "https://app.example/api/hanzihome/practice/attempts?surface=translation&contentId=segment-1",
   ),
  );

  expect(response.status).toBe(200);
  expect(listPracticeAttempts).toHaveBeenCalledWith(
   { surface: "translation", contentId: "segment-1" },
   "user-1",
  );
  expect(listRecentPracticeAttempts).not.toHaveBeenCalled();
 });

 it("loads a bounded recent evidence stream when content scope is omitted", async () => {
  listRecentPracticeAttempts.mockResolvedValue([]);

  const response = await GET(
   new Request("https://app.example/api/hanzihome/practice/attempts?surface=review&limit=25"),
  );

  expect(response.status).toBe(200);
  expect(listRecentPracticeAttempts).toHaveBeenCalledWith("user-1", {
   surface: "review",
   limit: 25,
  });
  expect(listPracticeAttempts).not.toHaveBeenCalled();
 });

 it("returns an exact owner-scoped evidence count for a bounded time window", async () => {
  countPracticeAttempts.mockResolvedValue(73);
  const since = "2026-08-20T00:00:00.000+07:00";
  const until = "2026-08-20T12:00:00.000+07:00";

  const response = await GET(
   new Request(
    `https://app.example/api/hanzihome/practice/attempts?mode=count&surface=review&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`,
   ),
  );

  expect(response.status).toBe(200);
  expect(countPracticeAttempts).toHaveBeenCalledWith("user-1", {
   surface: "review",
   since,
   until,
  });
  await expect(response.json()).resolves.toEqual({ count: 73 });
 });

 it("rejects a count request without both time boundaries", async () => {
  const response = await GET(
   new Request(
    "https://app.example/api/hanzihome/practice/attempts?mode=count&surface=review&since=2026-08-20T00%3A00%3A00.000Z",
   ),
  );

  expect(response.status).toBe(400);
  expect(countPracticeAttempts).not.toHaveBeenCalled();
 });

 it("rejects malformed attempts before the repository is called", async () => {
  const response = await POST(
   new Request("https://app.example/api/hanzihome/practice/attempts", {
    method: "POST",
    body: JSON.stringify({ surface: "translation", contentId: "segment-1" }),
   }),
  );

  expect(response.status).toBe(400);
  expect(savePracticeAttempt).not.toHaveBeenCalled();
 });

 it("persists a typed deterministic attempt payload", async () => {
  savePracticeAttempt.mockResolvedValue({ id: "attempt-1" });

  const response = await POST(
   new Request("https://app.example/api/hanzihome/practice/attempts", {
    method: "POST",
    body: JSON.stringify({
     surface: "dictation",
     contentId: "entry-1",
     direction: null,
     answer: { expectedText: "你好", answer: "你 好", mistakeCount: 1 },
     scorePercent: 50,
     responseMs: 1200,
    }),
   }),
  );

  expect(response.status).toBe(200);
  expect(savePracticeAttempt).toHaveBeenCalledWith(
   {
    surface: "dictation",
    contentId: "entry-1",
    direction: null,
    answer: { expectedText: "你好", answer: "你 好", mistakeCount: 1 },
    scorePercent: 50,
    responseMs: 1200,
   },
   "user-1",
  );
 });

 it("accepts a stable review attempt id without inventing a numeric score", async () => {
  const attemptId = "af84c8d0-aa7f-4af7-a4b7-71ff6e887a35";
  savePracticeAttempt.mockResolvedValue({ id: attemptId });

  const response = await POST(
   new Request("https://app.example/api/hanzihome/practice/attempts", {
    method: "POST",
    body: JSON.stringify({
     attemptId,
     surface: "review",
     contentId: "vocab:词语",
     direction: null,
     answer: {
      kind: "review",
      itemType: "vocab",
      result: "hard",
     },
     scorePercent: null,
     responseMs: null,
    }),
   }),
  );

  expect(response.status).toBe(200);
  expect(savePracticeAttempt).toHaveBeenCalledWith(
   {
    attemptId,
    surface: "review",
    contentId: "vocab:词语",
    direction: null,
    answer: {
     kind: "review",
     itemType: "vocab",
     result: "hard",
    },
    scorePercent: null,
    responseMs: null,
   },
   "user-1",
  );
 });

 it("rejects a malformed stable attempt id before persistence", async () => {
  const response = await POST(
   new Request("https://app.example/api/hanzihome/practice/attempts", {
    method: "POST",
    body: JSON.stringify({
     attemptId: "not-a-uuid",
     surface: "review",
     contentId: "grammar:point-1",
     direction: null,
     answer: {
      kind: "review",
      itemType: "grammar",
      result: "known",
     },
     scorePercent: null,
     responseMs: null,
    }),
   }),
  );

  expect(response.status).toBe(400);
  expect(savePracticeAttempt).not.toHaveBeenCalled();
 });
});
