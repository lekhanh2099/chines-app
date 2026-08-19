import { beforeEach, describe, expect, it, vi } from "vitest";

import { emptyLearningState } from "@/features/hanzihome/utils/learning-state";

const supabase = vi.hoisted(() => ({
 getUser: vi.fn(),
 from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
 createClient: () =>
  Promise.resolve({
   auth: { getUser: supabase.getUser },
   from: supabase.from,
  }),
}));

import { GET, PUT } from "./route";

function createReadQuery(updatedAt: string) {
 const query = {
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
 };
 query.select.mockReturnValue(query);
 query.eq.mockReturnValue(query);
 query.maybeSingle.mockResolvedValue({
  data: {
   settings: emptyLearningState.settings,
   progress: emptyLearningState.progress,
   bookmarks: emptyLearningState.bookmarks,
   review_history: emptyLearningState.reviewHistory,
   updated_at: updatedAt,
  },
  error: null,
 });
 return query;
}

describe("/api/learning-state", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  supabase.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
 });

 it("rejects unauthenticated reads", async () => {
  supabase.getUser.mockResolvedValue({ data: { user: null } });

  const response = await GET();

  expect(response.status).toBe(401);
  expect(supabase.from).not.toHaveBeenCalled();
 });

 it("rejects writes without an expected remote version", async () => {
  const response = await PUT(
   new Request("https://app.example/api/learning-state", {
    method: "PUT",
    body: JSON.stringify({ state: emptyLearningState }),
   }),
  );

  expect(response.status).toBe(400);
  expect(supabase.from).not.toHaveBeenCalled();
 });

 it("returns the authoritative state and version", async () => {
  const query = createReadQuery("2026-08-19T00:00:00.000Z");
  supabase.from.mockReturnValue(query);

  const response = await GET();

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
   state: emptyLearningState,
   updatedAt: "2026-08-19T00:00:00.000Z",
  });
 });

 it("rejects a stale write with the latest state", async () => {
  const query = createReadQuery("2026-08-19T00:00:01.000Z");
  supabase.from.mockReturnValue(query);

  const response = await PUT(
   new Request("https://app.example/api/learning-state", {
    method: "PUT",
    body: JSON.stringify({
     state: emptyLearningState,
     expectedUpdatedAt: "2026-08-19T00:00:00.000Z",
    }),
   }),
  );

  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
   code: "LEARNING_STATE_CONFLICT",
   state: emptyLearningState,
   updatedAt: "2026-08-19T00:00:01.000Z",
  });
 });
});
