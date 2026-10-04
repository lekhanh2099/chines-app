import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useVocabDetail } from "./useVocabDetail";
import { dictionaryQueryKeys } from "../query-keys";
import type { getVocabWithProgress } from "@/services/vocab/vocab.service";

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ supabase: {}, userId: "user-1", isResolved: true }),
}));
const fetchRequest = vi.fn<typeof fetch>();
let client: QueryClient;
const initial: Awaited<ReturnType<typeof getVocabWithProgress>> = {
 vocab: { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "hello", ai_analysis: {} },
 srsLevel: null,
 isSaved: false,
 personalNote: "",
 personalNoteMode: "important",
};
const key = dictionaryQueryKeys.vocabDetail("user-1", "你好");

function controller() {
 const captures: ReturnType<typeof useVocabDetail>[] = [];
 function Probe() {
  captures.push(useVocabDetail("你好"));
  return null;
 }
 renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)));
 const hook = captures[0];
 if (!hook) throw new Error("Missing hook");
 return hook;
}
beforeEach(() => {
 client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
 });
 client.setQueryData(key, initial);
 fetchRequest.mockReset();
 vi.stubGlobal("fetch", fetchRequest);
 onlineManager.setOnline(true);
});
afterEach(() => {
 client.clear();
 vi.unstubAllGlobals();
 onlineManager.setOnline(true);
});

describe("dictionary SRS save lifecycle", () => {
 it("keeps an already-offline mutation paused and unsaved until a real response acknowledges it", async () => {
  onlineManager.setOnline(false);
  fetchRequest.mockResolvedValue(
   Response.json({
    vocabId: "vocab-1",
    dictionaryId: "dictionary-1",
    contextSchemaAvailable: true,
    noteSchemaAvailable: true,
   }),
  );
  const pending = controller().saveMutation.mutateAsync({ vocabData: initial.vocab });
  await vi.waitFor(() => expect(client.getMutationCache().getAll()[0]?.state.isPaused).toBe(true));
  expect(fetchRequest).not.toHaveBeenCalled();
  expect(client.getQueryData<typeof initial>(key)?.isSaved).toBe(false);
  onlineManager.setOnline(true);
  await client.resumePausedMutations();
  await pending;
  expect(fetchRequest).toHaveBeenCalledOnce();
  expect(client.getQueryData<typeof initial>(key)?.isSaved).toBe(true);
 });
 it("rejects online-start/offline-failure without marking the cache saved", async () => {
  let rejectRequest = (_error: Error) => {};
  fetchRequest.mockImplementation(
   () =>
    new Promise<Response>((_resolve, reject) => {
     rejectRequest = reject;
    }),
  );
  const hook = controller();
  const pending = hook.saveMutation.mutateAsync({ vocabData: initial.vocab });
  const failure = expect(pending).rejects.toThrow("Connection lost");
  await vi.waitFor(() => expect(fetchRequest).toHaveBeenCalledOnce());
  vi.stubGlobal("navigator", { onLine: false });
  onlineManager.setOnline(false);
  rejectRequest(new Error("Connection lost"));
  await failure;
  expect(client.getQueryData<typeof initial>(key)?.isSaved).toBe(false);
 });
 it("marks saved only after a valid authenticated response", async () => {
  fetchRequest.mockResolvedValue(
   Response.json({
    vocabId: "vocab-1",
    dictionaryId: "dictionary-1",
    contextSchemaAvailable: true,
    noteSchemaAvailable: true,
   }),
  );
  await controller().saveMutation.mutateAsync({
   vocabData: initial.vocab,
   options: { personalNote: "Note" },
  });
  expect(fetchRequest).toHaveBeenCalledWith(
   "/api/dictionary/srs",
   expect.objectContaining({
    headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": "user-1" },
   }),
  );
  expect(client.getQueryData<typeof initial>(key)).toMatchObject({
   isSaved: true,
   personalNote: "Note",
  });
 });
 it.each([401, 409, 503])("propagates HTTP %s without saved state", async (status) => {
  fetchRequest.mockResolvedValue(new Response(null, { status }));
  await expect(
   controller().saveMutation.mutateAsync({ vocabData: initial.vocab }),
  ).rejects.toThrow();
  expect(client.getQueryData<typeof initial>(key)?.isSaved).toBe(false);
 });
});
