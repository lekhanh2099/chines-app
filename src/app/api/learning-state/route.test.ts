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

function learningStateRequest(
 method: "GET" | "PUT",
 options?: { ownerUserId?: string; body?: object },
) {
 return new Request("https://app.example/api/learning-state", {
  method,
  headers: {
   "X-HanziHome-Owner-Id": options?.ownerUserId ?? "user-1",
   ...(options?.body ? { "Content-Type": "application/json" } : {}),
  },
  body: options?.body ? JSON.stringify(options.body) : undefined,
 });
}

function createReadQuery(
 updatedAt: string,
 overrides?: Partial<{
  settings: unknown;
  progress: unknown;
  bookmarks: unknown;
  review_history: unknown;
 }>,
) {
 const query = {
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
 };
 query.select.mockReturnValue(query);
 query.eq.mockReturnValue(query);
 query.maybeSingle.mockResolvedValue({
  data: {
   settings: overrides?.settings ?? emptyLearningState.settings,
   progress: overrides?.progress ?? emptyLearningState.progress,
   bookmarks: overrides?.bookmarks ?? emptyLearningState.bookmarks,
   review_history: overrides?.review_history ?? emptyLearningState.reviewHistory,
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

  const response = await GET(learningStateRequest("GET"));

  expect(response.status).toBe(401);
  expect(supabase.from).not.toHaveBeenCalled();
 });

 it("rejects a request whose expected owner no longer matches the session", async () => {
  const response = await GET(learningStateRequest("GET", { ownerUserId: "user-a" }));

  expect(response.status).toBe(412);
  await expect(response.json()).resolves.toMatchObject({ code: "AUTH_OWNER_MISMATCH" });
  expect(supabase.from).not.toHaveBeenCalled();
 });

 it("rejects writes without an expected remote version", async () => {
  const response = await PUT(
   learningStateRequest("PUT", {
    body: { state: emptyLearningState },
   }),
  );

  expect(response.status).toBe(400);
  expect(supabase.from).not.toHaveBeenCalled();
 });

 it("returns the authoritative state and version", async () => {
  const query = createReadQuery("2026-08-19T00:00:00.000Z");
  supabase.from.mockReturnValue(query);

  const response = await GET(learningStateRequest("GET"));

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
   state: emptyLearningState,
   updatedAt: "2026-08-19T00:00:00.000Z",
  });
 });

 it("fails closed when the authoritative row is incompatible", async () => {
  const query = createReadQuery("2026-08-19T00:00:00.000Z", {
   review_history: { legacy: "not-an-array" },
  });
  supabase.from.mockReturnValue(query);

  const response = await GET(learningStateRequest("GET"));

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toMatchObject({ code: "LEARNING_STATE_INVALID" });
 });

 it("rejects a stale write with the latest state", async () => {
  const query = createReadQuery("2026-08-19T00:00:01.000Z");
  supabase.from.mockReturnValue(query);

  const response = await PUT(
   learningStateRequest("PUT", {
    body: {
     state: emptyLearningState,
     expectedUpdatedAt: "2026-08-19T00:00:00.000Z",
    },
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
