import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, hasHanziHomeContentCapability, from } = vi.hoisted(() => {
 const emptyQuery = {
  select: () => emptyQuery,
  not: () => emptyQuery,
  is: () => emptyQuery,
  order: () => emptyQuery,
  then: (resolve: (value: { data: never[]; error: null }) => void) =>
   resolve({ data: [], error: null }),
 };
 return {
  getUser: vi.fn(),
  hasHanziHomeContentCapability: vi.fn(),
  from: vi.fn(() => emptyQuery),
 };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser }, from })),
}));
vi.mock("@/features/hanzihome/server/content-capability", () => ({
 hasHanziHomeContentCapability,
}));

import { GET } from "./route";

describe("GET /api/hanzihome/content/deleted", () => {
 beforeEach(() => {
  getUser.mockReset();
  hasHanziHomeContentCapability.mockReset();
  from.mockClear();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
 });

 it("refuses a signed-in learner before reading any content table", async () => {
  hasHanziHomeContentCapability.mockResolvedValue(false);

  const response = await GET();

  expect(response.status).toBe(403);
  expect(from).not.toHaveBeenCalled();
 });

 it("lets an editor list deleted content", async () => {
  hasHanziHomeContentCapability.mockResolvedValue(true);

  const response = await GET();

  expect(response.status).toBe(200);
  expect(from).toHaveBeenCalled();
 });
});
