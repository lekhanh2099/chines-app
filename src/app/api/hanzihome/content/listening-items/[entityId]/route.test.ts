import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuthenticatedRoute, rpc } = vi.hoisted(() => ({
 requireAuthenticatedRoute: vi.fn(),
 rpc: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
}));
vi.mock("@/features/hanzihome/server/canonical-content-mutation", () => ({
 mutationError: (message: string, status: number) => Response.json({ error: message }, { status }),
}));

import { PATCH } from "./route";

describe("PATCH /api/hanzihome/content/listening-items/:entityId", () => {
 beforeEach(() => {
  requireAuthenticatedRoute.mockReset();
  rpc.mockReset();
 });

 it("rejects an unauthenticated request before parsing its body or calling the RPC", async () => {
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 }),
  });

  const response = await PATCH(
   new Request("https://app.example/api/hanzihome/content/listening-items/listening-1", {
    method: "PATCH",
    body: "not-json",
   }),
   { params: Promise.resolve({ entityId: "listening-1" }) },
  );

  expect(response.status).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
 });
});
