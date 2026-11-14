import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";
import type { upsertLearningLoopItem } from "@/features/hanzihome/learning-loop/learning-loop-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { DictationAttempt } from "./dictation-session";
import { useDictationAttempts } from "./useDictationAttempts";

const mocks = vi.hoisted(() => ({
 attempt: vi.fn<typeof savePracticeAttempt>(),
 loop: vi.fn<typeof upsertLearningLoopItem>(),
}));
vi.mock("@/features/hanzihome/practice/practice-attempt-api", () => ({
 savePracticeAttempt: mocks.attempt,
}));
vi.mock("@/features/hanzihome/learning-loop/learning-loop-api", () => ({
 upsertLearningLoopItem: mocks.loop,
}));
vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: "owner-1", isResolved: true }),
}));
let client: QueryClient;
function controller() {
 const captures: ReturnType<typeof useDictationAttempts>[] = [];
 function Probe() {
  captures.push(useDictationAttempts());
  return null;
 }
 renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)));
 const hook = captures[0];
 if (!hook) throw new Error("Missing dictation hook");
 return hook;
}
const attempt: DictationAttempt = {
 entryId: "entry-1",
 expectedText: "你好",
 answer: "你",
 score: 50,
 mistakeCount: 1,
 responseMs: 1000,
};
beforeEach(() => {
 vi.resetAllMocks();
 client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
 mocks.attempt.mockResolvedValue({
  id: "attempt-1",
  user_id: "owner-1",
  surface: "dictation",
  content_id: "entry-1",
  direction: null,
  answer: {},
  score: 0.5,
  response_ms: 1000,
  created_at: "2026-10-04T00:00:00Z",
 });
 mocks.loop.mockImplementation(async (item) => ({
  ...item,
  user_id: "owner-1",
  created_at: "2026-10-04T00:00:00Z",
  updated_at: "2026-10-04T00:00:00Z",
 }));
});
afterEach(() => client.clear());
describe("Dictation write ownership", () => {
 it("saves every attempt and only creates a review item for mistakes", async () => {
  const hook = controller();
  hook.persistAttempt({ ...attempt, answer: "你好", score: 100, mistakeCount: 0 });
  await vi.waitFor(() => expect(mocks.attempt).toHaveBeenCalledOnce());
  expect(mocks.attempt).toHaveBeenCalledWith(
   expect.objectContaining({ surface: "dictation", contentId: "entry-1", scorePercent: 100 }),
   { expectedOwnerId: "owner-1" },
  );
  expect(mocks.loop).not.toHaveBeenCalled();
  const ownKey = hanzihomeQueryKeys.learningLoopForUser("owner-1");
  const otherKey = hanzihomeQueryKeys.learningLoopForUser("owner-2");
  client.setQueryData(ownKey, []);
  client.setQueryData(otherKey, []);
  hook.persistAttempt(attempt);
  await vi.waitFor(() => expect(client.getQueryState(ownKey)?.isInvalidated).toBe(true));
  expect(mocks.attempt).toHaveBeenCalledTimes(2);
  expect(mocks.loop.mock.calls[0]?.[0]).toMatchObject({
   stable_key: "dictation:entry-1",
   error_key: "mistakes:1",
  });
  expect(client.getQueryState(otherKey)?.isInvalidated).toBe(false);
 });
 it("retains a rejected write as an error instead of reporting saved", async () => {
  mocks.attempt.mockRejectedValueOnce(new Error("Rejected"));
  controller().persistAttempt({ ...attempt, mistakeCount: 0 });
  await vi.waitFor(() =>
   expect(client.getMutationCache().getAll()[0]?.state.error?.message).toBe("Rejected"),
  );
  expect(mocks.loop).not.toHaveBeenCalled();
 });
});
