import { DictionarySrsQueuedError } from "@/types/error";
import { saveDictionarySrs } from "@/features/dictionary/dictionary-srs-api";
import { saveDictionarySrsDurably } from "@/features/dictionary/dictionary-srs-outbox";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSmartSelectionInsights } from "./useSmartSelectionInsights";
import { SmartSelectionResultSchema, type SmartSelectionResult } from "@/types/database";

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: "user-1", isResolved: true }),
}));
vi.mock(import("@/features/dictionary/dictionary-srs-outbox"), async (importOriginal) => ({
 ...(await importOriginal()),
 saveDictionarySrsDurably: vi.fn(),
}));
const durableSave = vi.mocked(saveDictionarySrsDurably);
const fetchRequest = vi.fn<typeof fetch>();
let client: QueryClient;
const initial = SmartSelectionResultSchema.parse({
 mode: "word",
 selection: "你好",
 context_sentence: "你好。",
 entry: { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "hello" },
 radicals: [],
 components: [],
 definitions: [],
 meaning_summary: "hello",
 etymology: "",
 mnemonic_story: "",
 translation: "",
 grammar_points: [],
 isSaved: false,
 found: true,
 personal_note: "",
 personal_note_mode: "important",
});

function controller() {
 const captures: ReturnType<typeof useSmartSelectionInsights>[] = [];
 function Probe() {
  captures.push(useSmartSelectionInsights("你好", "你好。"));
  return null;
 }
 renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)));
 const hook = captures[0];
 if (!hook) throw new Error("Missing hook");
 return hook;
}
function selectionQuery() {
 const query = client
  .getQueryCache()
  .getAll()
  .find((item) => item.queryKey[0] === "editor-smart-selection");
 if (!query) throw new Error("Missing selection query");
 return query;
}
beforeEach(() => {
 client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
 });
 controller();
 client.setQueryData(selectionQuery().queryKey, initial);
 durableSave.mockReset();
 durableSave.mockImplementation(saveDictionarySrs);
 fetchRequest.mockReset();
 vi.stubGlobal("fetch", fetchRequest);
 onlineManager.setOnline(true);
});
afterEach(() => {
 client.clear();
 vi.unstubAllGlobals();
 onlineManager.setOnline(true);
});

describe("smart selection SRS save", () => {
 it("commits offline selection intent without marking the query saved", async () => {
  onlineManager.setOnline(false);
  durableSave.mockRejectedValueOnce(new DictionarySrsQueuedError());
  await expect(controller().saveSelection({ personalNote: "Pending" })).rejects.toBeInstanceOf(
   DictionarySrsQueuedError,
  );
  expect(durableSave).toHaveBeenCalledWith(
   expect.objectContaining({ hanzi: "你好", personalNote: "Pending" }),
   "user-1",
  );
  expect(client.getMutationCache().getAll()[0]?.state.isPaused).toBe(false);
  expect(client.getQueryData<SmartSelectionResult>(selectionQuery().queryKey)?.isSaved).toBe(false);
 });
 it("does not turn an offline failure into a queued success", async () => {
  let rejectRequest = (_error: Error) => {};
  fetchRequest.mockImplementation(
   () =>
    new Promise<Response>((_resolve, reject) => {
     rejectRequest = reject;
    }),
  );
  const pending = controller().saveSelection({ personalNote: "Keep intent" });
  const failure = expect(pending).rejects.toThrow("Offline");
  await vi.waitFor(() => expect(fetchRequest).toHaveBeenCalledOnce());
  vi.stubGlobal("navigator", { onLine: false });
  onlineManager.setOnline(false);
  rejectRequest(new Error("Offline"));
  await failure;
  expect(client.getQueryData<SmartSelectionResult>(selectionQuery().queryKey)?.isSaved).toBe(false);
 });
 it("acknowledges the saved note only after server success", async () => {
  fetchRequest.mockResolvedValue(
   Response.json({
    vocabId: "v-1",
    dictionaryId: "d-1",
    contextSchemaAvailable: true,
    noteSchemaAvailable: true,
   }),
  );
  await controller().saveSelection({ personalNote: "Saved", personalNoteMode: "important" });
  expect(client.getQueryData<SmartSelectionResult>(selectionQuery().queryKey)).toMatchObject({
   isSaved: true,
   personal_note: "Saved",
   personal_note_mode: "important",
  });
 });
 it("rejects malformed acknowledgements without saved state", async () => {
  fetchRequest.mockResolvedValue(Response.json({ offlineQueued: true }));
  await expect(controller().saveSelection()).rejects.toThrow();
  expect(client.getQueryData<SmartSelectionResult>(selectionQuery().queryKey)?.isSaved).toBe(false);
 });
});
