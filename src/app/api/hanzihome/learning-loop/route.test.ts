import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
 appendLearningEvent,
 listLearningLoopItems,
 rateLearningLoopItem,
 saveLearningLoopItem,
 requireAuthenticatedRoute,
} = vi.hoisted(() => ({
 appendLearningEvent: vi.fn(),
 listLearningLoopItems: vi.fn(),
 rateLearningLoopItem: vi.fn(),
 saveLearningLoopItem: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/reader/reader-state-repository", () => ({
 appendLearningEvent,
 listLearningLoopItems,
 rateLearningLoopItem,
 saveLearningLoopItem,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET, POST } from "./route";

describe("/api/hanzihome/learning-loop", () => {
 beforeEach(() => {
  appendLearningEvent.mockReset();
  listLearningLoopItems.mockReset();
  rateLearningLoopItem.mockReset();
  saveLearningLoopItem.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
 });

 it("lists only through the authenticated repository", async () => {
  listLearningLoopItems.mockResolvedValue([]);

  const response = await GET();

  expect(response.status).toBe(200);
  expect(listLearningLoopItems).toHaveBeenCalledOnce();
  await expect(response.json()).resolves.toEqual({ items: [] });
 });

 it("routes a rate action to the optimistic server RPC wrapper", async () => {
  rateLearningLoopItem.mockResolvedValue({ id: "item-1", revision: 2 });

  const response = await POST(
   new Request("https://app.example/api/hanzihome/learning-loop", {
    method: "POST",
    body: JSON.stringify({ action: "rate", itemId: "item-1", rating: "good", expectedRevision: 1 }),
   }),
  );

  expect(response.status).toBe(200);
  expect(rateLearningLoopItem).toHaveBeenCalledWith({
   itemId: "item-1",
   rating: "good",
   expectedRevision: 1,
  });
 });

 it("rejects unknown actions without mutating state", async () => {
  const response = await POST(
   new Request("https://app.example/api/hanzihome/learning-loop", {
    method: "POST",
    body: JSON.stringify({ action: "delete", itemId: "item-1" }),
   }),
  );

  expect(response.status).toBe(400);
  expect(rateLearningLoopItem).not.toHaveBeenCalled();
  expect(saveLearningLoopItem).not.toHaveBeenCalled();
  expect(appendLearningEvent).not.toHaveBeenCalled();
 });
});
