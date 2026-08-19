import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listPracticeAttempts, savePracticeAttempt, requireAuthenticatedRoute } = vi.hoisted(() => ({
 listPracticeAttempts: vi.fn(),
 savePracticeAttempt: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/reader/reader-state-repository", () => ({
 listPracticeAttempts,
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
 beforeEach(() => {
  listPracticeAttempts.mockReset();
  savePracticeAttempt.mockReset();
  requireAuthenticatedRoute.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
 });

 it("loads history within the requested surface and content scope", async () => {
  listPracticeAttempts.mockResolvedValue([]);

  const response = await GET(
   new Request(
    "https://app.example/api/hanzihome/practice/attempts?surface=translation&contentId=segment-1",
   ),
  );

  expect(response.status).toBe(200);
  expect(listPracticeAttempts).toHaveBeenCalledWith({
   surface: "translation",
   contentId: "segment-1",
  });
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
  expect(savePracticeAttempt).toHaveBeenCalledWith({
   surface: "dictation",
   contentId: "entry-1",
   direction: null,
   answer: { expectedText: "你好", answer: "你 好", mistakeCount: 1 },
   scorePercent: 50,
   responseMs: 1200,
  });
 });
});
