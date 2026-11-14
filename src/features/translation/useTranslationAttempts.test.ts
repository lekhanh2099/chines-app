import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
 fetchPracticeAttempts,
 savePracticeAttempt,
} from "@/features/hanzihome/practice/practice-attempt-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { useTranslationAttempts } from "./useTranslationAttempts";

const mocks = vi.hoisted(() => ({
 fetch: vi.fn<typeof fetchPracticeAttempts>(),
 save: vi.fn<typeof savePracticeAttempt>(),
}));
vi.mock("@/features/hanzihome/practice/practice-attempt-api", () => ({
 fetchPracticeAttempts: mocks.fetch,
 savePracticeAttempt: mocks.save,
}));
vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: "owner-1", isResolved: true }),
}));
let client: QueryClient;
function controller(contentId: string) {
 const captures: ReturnType<typeof useTranslationAttempts>[] = [];
 function Probe() {
  captures.push(useTranslationAttempts(contentId));
  return null;
 }
 renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)));
 const hook = captures[0];
 if (!hook) throw new Error("Missing translation hook");
 return hook;
}
beforeEach(() => {
 vi.resetAllMocks();
 client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
 });
 mocks.fetch.mockResolvedValue([]);
});
afterEach(() => client.clear());
describe("Translation attempt query and write ownership", () => {
 it("uses the actual history query and invalidates only the acknowledged segment", async () => {
  const firstKey = hanzihomeQueryKeys.practiceAttempts("owner-1", "translation", "first");
  const secondKey = hanzihomeQueryKeys.practiceAttempts("owner-1", "translation", "second");
  const first = controller("first");
  controller("second");
  const query = client.getQueryCache().find({ queryKey: firstKey });
  if (!query) throw new Error("Missing history query");
  await query.fetch();
  client.setQueryData(secondKey, []);
  expect(mocks.fetch).toHaveBeenCalledWith({ surface: "translation", contentId: "first" });
  const payload: Parameters<typeof savePracticeAttempt>[0] = {
   surface: "translation",
   contentId: "first",
   direction: "zh-vi",
   answer: { answer: "Answer" },
   scorePercent: 80,
   responseMs: 1000,
  };
  mocks.save.mockResolvedValue({
   id: "attempt-1",
   user_id: "owner-1",
   surface: "translation",
   content_id: "first",
   direction: "zh-vi",
   answer: payload.answer,
   score: 0.8,
   response_ms: 1000,
   created_at: "2026-10-04T00:00:00Z",
  });
  first.submitAttempt(payload);
  await vi.waitFor(() =>
   expect(client.getMutationCache().getAll()[0]?.state.status).toBe("success"),
  );
  expect(mocks.save).toHaveBeenCalledWith(payload, { expectedOwnerId: "owner-1" });
  expect(client.getQueryState(firstKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(secondKey)?.isInvalidated).toBe(false);
 });
 it("preserves failed writes as errors and does not invalidate history on rejection", async () => {
  const key = hanzihomeQueryKeys.practiceAttempts("owner-1", "translation", "first");
  const hook = controller("first");
  client.setQueryData(key, []);
  mocks.save.mockRejectedValueOnce(new Error("Rejected"));
  hook.submitAttempt({
   surface: "translation",
   contentId: "first",
   direction: null,
   answer: {},
   scorePercent: null,
   responseMs: null,
  });
  await vi.waitFor(() =>
   expect(client.getMutationCache().getAll()[0]?.state.error?.message).toBe("Rejected"),
  );
  expect(client.getQueryState(key)?.isInvalidated).toBe(false);
 });
});
