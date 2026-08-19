import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getReaderStateBootstrap, requireAuthenticatedRoute } = vi.hoisted(() => ({
 getReaderStateBootstrap: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/reader/reader-state-repository", () => ({
 getReaderStateBootstrap,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";

describe("/api/hanzihome/reader/state", () => {
 beforeEach(() => {
  getReaderStateBootstrap.mockReset();
  requireAuthenticatedRoute.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context: {} });
 });

 it("returns the merged state with one repository call", async () => {
  const state = { progress: null, annotations: [], overrides: [] };
  getReaderStateBootstrap.mockResolvedValue(state);

  const response = await GET(
   new Request("https://app.example/api/hanzihome/reader/state?documentId=reader-1"),
  );

  expect(response.status).toBe(200);
  expect(getReaderStateBootstrap).toHaveBeenCalledWith("reader-1", {});
  await expect(response.json()).resolves.toEqual(state);
 });

 it("keeps unauthenticated bootstrap observable as 401", async () => {
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const response = await GET(
   new Request("https://app.example/api/hanzihome/reader/state?documentId=reader-1"),
  );

  expect(response.status).toBe(401);
  expect(getReaderStateBootstrap).not.toHaveBeenCalled();
 });
});
