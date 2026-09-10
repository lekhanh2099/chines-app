import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "./memory-tip-api";
import type { MemoryTip } from "./memory-tip.schema";
import {
 useArchiveMemoryTipMutation,
 useCreateMemoryTipMutation,
 useUpdateMemoryTipMutation,
} from "./useMemoryTips";

vi.mock("./memory-tip-api");

function createFixtureTip(overrides?: Partial<MemoryTip>): MemoryTip {
 return {
  id: "tip-1",
  ownerId: "user-1",
  scope: "user",
  tipType: "custom",
  title: "Initial Title",
  body: "Initial Tip Body",
  tags: ["hsk1"],
  sourceType: "custom",
  weight: 1,
  isPinned: false,
  isArchived: false,
  createdAt: "2026-09-10T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
  ...overrides,
 };
}

function renderMutationProbe<T>(queryClient: QueryClient, useHook: () => T) {
 let hookValue: T | undefined;
 function Probe() {
  hookValue = useHook();
  return null;
 }
 renderToStaticMarkup(
  createElement(QueryClientProvider, { client: queryClient }, createElement(Probe)),
 );
 if (!hookValue) throw new Error("Probe failed to capture mutation hook");
 return hookValue;
}

describe("useMemoryTips optimistic mutations", () => {
 let queryClient: QueryClient;
 const queryKey = api.memoryTipsQueryKey;

 beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({
   defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
   },
  });
 });

 it("seeds created tip directly into cache on success", async () => {
  const existing = createFixtureTip({ id: "tip-1" });
  queryClient.setQueryData(queryKey, [existing]);

  const createdTip: MemoryTip = createFixtureTip({
   id: "tip-new",
   title: "New Created Tip",
  });

  vi.mocked(api.createMemoryTip).mockResolvedValue(createdTip);

  const mutation = renderMutationProbe(queryClient, useCreateMemoryTipMutation);
  await mutation.mutateAsync({
   title: "New Created Tip",
   body: "New Tip Body",
   tags: [],
  });

  const finalCache = queryClient.getQueryData<MemoryTip[]>(queryKey);
  expect(finalCache).toHaveLength(2);
  expect(finalCache?.[0]?.id).toBe("tip-new");
  expect(finalCache?.[1]?.id).toBe("tip-1");
 });

 it("optimistically updates tip fields and reverts on error", async () => {
  const tip1 = createFixtureTip({ id: "tip-1", title: "Original 1" });
  const tip2 = createFixtureTip({ id: "tip-2", title: "Original 2" });
  queryClient.setQueryData(queryKey, [tip1, tip2]);

  let rejectApi: (err: Error) => void = () => {};
  vi.mocked(api.updateMemoryTip).mockImplementation(
   () =>
    new Promise((_, reject) => {
     rejectApi = reject;
    }),
  );

  const mutation = renderMutationProbe(queryClient, useUpdateMemoryTipMutation);
  const promise = mutation
   .mutateAsync({
    tipId: "tip-1",
    input: { title: "Updated Optimistically" },
   })
   .catch(() => null);

  // Assert optimistic update is in cache while in-flight
  await vi.waitFor(() => {
   const cache = queryClient.getQueryData<MemoryTip[]>(queryKey);
   expect(cache?.find((t) => t.id === "tip-1")?.title).toBe("Updated Optimistically");
  });

  // Fail request
  rejectApi(new Error("Update failed"));
  await promise;

  // Cache should roll back tip-1, leaving tip-2 untouched
  const finalCache = queryClient.getQueryData<MemoryTip[]>(queryKey);
  expect(finalCache?.find((t) => t.id === "tip-1")?.title).toBe("Original 1");
  expect(finalCache?.find((t) => t.id === "tip-2")?.title).toBe("Original 2");
 });

 it("optimistically archives tip and restores on error", async () => {
  const tip1 = createFixtureTip({ id: "tip-1" });
  const tip2 = createFixtureTip({ id: "tip-2" });
  queryClient.setQueryData(queryKey, [tip1, tip2]);

  let rejectApi: (err: Error) => void = () => {};
  vi.mocked(api.archiveMemoryTip).mockImplementation(
   () =>
    new Promise((_, reject) => {
     rejectApi = reject;
    }),
  );

  const mutation = renderMutationProbe(queryClient, useArchiveMemoryTipMutation);
  const promise = mutation.mutateAsync("tip-1").catch(() => null);

  // Optimistically removed
  await vi.waitFor(() => {
   const cache = queryClient.getQueryData<MemoryTip[]>(queryKey);
   expect(cache).toHaveLength(1);
   expect(cache?.[0]?.id).toBe("tip-2");
  });

  // Fail request
  rejectApi(new Error("Archive failed"));
  await promise;

  // Restored to cache at index 0
  const finalCache = queryClient.getQueryData<MemoryTip[]>(queryKey);
  expect(finalCache).toHaveLength(2);
  expect(finalCache?.[0]?.id).toBe("tip-1");
  expect(finalCache?.[1]?.id).toBe("tip-2");
 });
});
