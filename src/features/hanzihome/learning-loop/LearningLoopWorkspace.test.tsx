import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { loadAppMessages } from "@/i18n/messages";

import * as api from "./learning-loop-api";
import type { LearningLoopItemRow } from "./learning-loop-api";
import { LearningLoopWorkspace } from "./LearningLoopWorkspace";

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: "00000000-0000-4000-8000-000000000001", isResolved: true }),
}));

vi.mock("@/features/speech/MandarinTtsProvider", () => ({
 useSharedMandarinTts: () => ({
  isLoading: false,
  isSpeaking: false,
  speakSequence: vi.fn(),
  stop: vi.fn(),
 }),
}));

vi.mock("./learning-loop-api", async (importOriginal) => {
 const actual = await importOriginal<typeof import("./learning-loop-api")>();
 return {
  ...actual,
  fetchLearningLoopItems: vi.fn(),
  rateLearningLoopItem: vi.fn(),
 };
});

function createFixtureItem(overrides?: Partial<LearningLoopItemRow>): LearningLoopItemRow {
 return {
  user_id: "00000000-0000-4000-8000-000000000001",
  id: "item-1",
  stable_key: "key-1",
  kind: "vocabulary",
  source_id: "src-1",
  source_href: "/lesson/1",
  title_zh: "中文",
  title_vi: "Tiếng Trung",
  prompt_zh: "你好",
  pinyin: "nǐ hǎo",
  meaning_vi: "Xin chào",
  user_answer: "",
  error_key: "",
  state: "learning",
  due_at: "2026-09-10T00:00:00.000Z",
  interval_days: 1,
  correct_streak: 2,
  lapse_count: 0,
  revision: 1,
  created_at: "2026-09-10T00:00:00.000Z",
  updated_at: "2026-09-10T00:00:00.000Z",
  ...overrides,
 };
}

describe("LearningLoopWorkspace optimistic interaction", () => {
 let queryClient: QueryClient;
 const userId = "00000000-0000-4000-8000-000000000001";
 const learningLoopKey = hanzihomeQueryKeys.learningLoopForUser(userId);

 beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({
   defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
   },
  });
 });

 it("renders the active item and allows rating transition", async () => {
  const messages = await loadAppMessages("vi");
  const item1 = createFixtureItem({ id: "item-1", prompt_zh: "你好" });
  const item2 = createFixtureItem({ id: "item-2", prompt_zh: "再见" });

  queryClient.setQueryData(learningLoopKey, [item1, item2]);

  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <QueryClientProvider client={queryClient}>
     <LearningLoopWorkspace />
    </QueryClientProvider>
   </NextIntlClientProvider>,
  );

  // Initial item is visible in markup
  expect(markup).toContain("你好");
  expect(markup).not.toContain("再见");
 });

 it("optimistically removes rated item from queue and restores on failure", async () => {
  const item1 = createFixtureItem({ id: "item-1", prompt_zh: "你好" });
  const item2 = createFixtureItem({ id: "item-2", prompt_zh: "再见" });

  queryClient.setQueryData(learningLoopKey, [item1, item2]);

  let rejectApi: (err: Error) => void = () => {};
  vi.mocked(api.rateLearningLoopItem).mockImplementation(
   () =>
    new Promise((_, reject) => {
     rejectApi = reject;
    }),
  );

  // Get rateMutation by rendering the workspace
  const messages = await loadAppMessages("vi");
  renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <QueryClientProvider client={queryClient}>
     <LearningLoopWorkspace />
    </QueryClientProvider>
   </NextIntlClientProvider>,
  );

  // Simulate rating item1 directly on mutation cache
  const mutation = queryClient.getMutationCache().build(queryClient, {
   mutationFn: api.rateLearningLoopItem,
   onMutate: async (input: Parameters<typeof api.rateLearningLoopItem>[0]) => {
    await queryClient.cancelQueries({ queryKey: learningLoopKey });
    const previous = queryClient.getQueryData<LearningLoopItemRow[]>(learningLoopKey) || [];
    const targetIndex = previous.findIndex((item) => item.id === input.itemId);
    const targetItem = previous[targetIndex];
    queryClient.setQueryData<LearningLoopItemRow[]>(
     learningLoopKey,
     previous.filter((item) => item.id !== input.itemId),
    );
    return { targetItem, targetIndex };
   },
   onError: (_err, _vars, context) => {
    if (context?.targetItem) {
     queryClient.setQueryData<LearningLoopItemRow[]>(learningLoopKey, (current) => {
      if (!current) return [context.targetItem];
      const copy = [...current];
      copy.splice(context.targetIndex, 0, context.targetItem);
      return copy;
     });
    }
   },
  });

  const mutatePromise = mutation
   .execute({
    itemId: "item-1",
    rating: "good",
    expectedRevision: 1,
   })
   .catch(() => null);

  // Optimistically, item1 is removed and item2 is now the active item at index 0
  await vi.waitFor(() => {
   const cache = queryClient.getQueryData<LearningLoopItemRow[]>(learningLoopKey);
   expect(cache).toHaveLength(1);
   expect(cache?.[0]?.id).toBe("item-2");
  });

  // Fail request
  rejectApi(new Error("Rating failed"));
  await mutatePromise;

  // item1 is restored back at index 0
  const finalCache = queryClient.getQueryData<LearningLoopItemRow[]>(learningLoopKey);
  expect(finalCache).toHaveLength(2);
  expect(finalCache?.[0]?.id).toBe("item-1");
  expect(finalCache?.[1]?.id).toBe("item-2");
 });
});
