import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getReaderProgress, saveReaderProgressOwnedState, requireAuthenticatedRoute, verifyOwner } =
 vi.hoisted(() => ({
  getReaderProgress: vi.fn(),
  saveReaderProgressOwnedState: vi.fn(),
  requireAuthenticatedRoute: vi.fn(),
  verifyOwner: vi.fn(),
 }));

vi.mock("server-only", () => ({}));
vi.mock("@/features/reading/repositories/reading-progress.repository", () => ({
 getReaderProgress,
 saveReaderProgressOwnedState,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner: verifyOwner,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET, PUT } from "./route";

describe("/api/hanzihome/reader/progress", () => {
 const context = { user: { id: "user-1" } };

 beforeEach(() => {
  getReaderProgress.mockReset();
  saveReaderProgressOwnedState.mockReset();
  requireAuthenticatedRoute.mockReset();
  verifyOwner.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context });
  verifyOwner.mockReturnValue(null);
 });

 it("rejects an owner mismatch before reading reader state", async () => {
  verifyOwner.mockReturnValue(
   Response.json({ error: "owner mismatch", code: "AUTH_OWNER_MISMATCH" }, { status: 412 }),
  );

  const response = await GET(
   new Request("https://app.example/api/hanzihome/reader/progress?documentId=reader-1"),
  );

  expect(response.status).toBe(412);
  expect(getReaderProgress).not.toHaveBeenCalled();
 });

 it("requires a document id before loading progress", async () => {
  const response = await GET(new Request("https://app.example/api/hanzihome/reader/progress"));

  expect(response.status).toBe(400);
  expect(getReaderProgress).not.toHaveBeenCalled();
 });

 it("loads progress through the server repository", async () => {
  getReaderProgress.mockResolvedValue(null);

  const response = await GET(
   new Request("https://app.example/api/hanzihome/reader/progress?documentId=reader-1"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(getReaderProgress).toHaveBeenCalledWith("reader-1", context);
  await expect(response.json()).resolves.toEqual({ progress: null });
 });

 it("rejects malformed writes before reaching Supabase", async () => {
  const response = await PUT(
   new Request("https://app.example/api/hanzihome/reader/progress", {
    method: "PUT",
    body: JSON.stringify({ documentId: "reader-1", expectedRevision: 0 }),
   }),
  );

  expect(response.status).toBe(400);
  expect(saveReaderProgressOwnedState).not.toHaveBeenCalled();
 });

 it("writes only the Reader-owned completion and answer contract", async () => {
  saveReaderProgressOwnedState.mockResolvedValue({ id: "progress" });
  const payload = {
   documentId: "reader-1",
   completed: true,
   answers: {},
   expectedRevision: 2,
  };

  const response = await PUT(
   new Request("https://app.example/api/hanzihome/reader/progress", {
    method: "PUT",
    body: JSON.stringify(payload),
   }),
  );

  expect(response.status).toBe(200);
  expect(saveReaderProgressOwnedState).toHaveBeenCalledWith(payload, context);
 });

 it("keeps stale progress writes observable as conflicts", async () => {
  saveReaderProgressOwnedState.mockRejectedValue(new Error("stale"));

  const response = await PUT(
   new Request("https://app.example/api/hanzihome/reader/progress", {
    method: "PUT",
    body: JSON.stringify({
     documentId: "reader-1",
     completed: false,
     answers: {},
     expectedRevision: 1,
    }),
   }),
  );

  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({ code: "READER_PROGRESS_CONFLICT" });
 });
});
