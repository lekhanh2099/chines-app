import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getReaderStateBootstrap, requireAuthenticatedRoute, verifyOwner } = vi.hoisted(() => ({
 getReaderStateBootstrap: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
 verifyOwner: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/reading/repositories/reading-state-bootstrap.repository", () => ({
 getReaderStateBootstrap,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner: verifyOwner,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { GET } from "./route";
import { GET as canonicalGET } from "@/app/api/reading/state/route";

describe("/api/hanzihome/reader/state", () => {
 const context = { user: { id: "user-1" } };

 it("delegates to the exact canonical handler without redirecting", () => {
  expect(GET).toBe(canonicalGET);
 });

 beforeEach(() => {
  getReaderStateBootstrap.mockReset();
  requireAuthenticatedRoute.mockReset();
  verifyOwner.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({ authenticated: true, context });
  verifyOwner.mockReturnValue(null);
 });

 it("rejects an owner mismatch before bootstrapping Reader state", async () => {
  verifyOwner.mockReturnValue(
   Response.json({ error: "owner mismatch", code: "AUTH_OWNER_MISMATCH" }, { status: 412 }),
  );

  const response = await GET(
   new Request("https://app.example/api/hanzihome/reader/state?documentId=reader-1"),
  );

  expect(response.status).toBe(412);
  expect(getReaderStateBootstrap).not.toHaveBeenCalled();
 });

 it("returns the merged state with one repository call", async () => {
  const state = { progress: null, annotations: [], overrides: [] };
  getReaderStateBootstrap.mockResolvedValue(state);

  const response = await GET(
   new Request("https://app.example/api/hanzihome/reader/state?documentId=reader-1"),
  );

  expect(response.status).toBe(200);
  expect(getReaderStateBootstrap).toHaveBeenCalledWith("reader-1", context);
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
