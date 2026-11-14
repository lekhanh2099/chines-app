import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTtsLibrary, useTtsLibraryMutations } from "./useTtsLibrary";
import type { createTtsFolder, fetchTtsLibrary, saveTtsClip } from "./tts-studio-api";
import { hanzihomeQueryKeys } from "../query-keys";

const mocks = vi.hoisted(() => ({
 fetch: vi.fn<typeof fetchTtsLibrary>(),
 folder: vi.fn<typeof createTtsFolder>(),
 clip: vi.fn<typeof saveTtsClip>(),
}));
vi.mock("./tts-studio-api", () => ({
 fetchTtsLibrary: mocks.fetch,
 createTtsFolder: mocks.folder,
 saveTtsClip: mocks.clip,
}));
vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: "owner-1", isResolved: true }),
}));
let client: QueryClient;
const key = hanzihomeQueryKeys.ttsLibraryForUser("owner-1");
function controller() {
 const captures: ReturnType<typeof useTtsLibraryMutations>[] = [];
 function Probe() {
  useTtsLibrary(true);
  captures.push(useTtsLibraryMutations());
  return null;
 }
 renderToStaticMarkup(
  createElement(QueryClientProvider, { client }, createElement(Probe), createElement(Probe)),
 );
 const result = captures[0];
 if (!result) throw new Error("Missing library hook");
 return result;
}
beforeEach(() => {
 client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
 });
 vi.resetAllMocks();
 mocks.fetch.mockResolvedValue({ folders: [], clips: [] });
});
afterEach(() => client.clear());
describe("TTS library canonical query owner", () => {
 it("deduplicates two consumers into one owner-scoped query", async () => {
  controller();
  const query = client.getQueryCache().find({ queryKey: key });
  if (!query) throw new Error("Missing library query");
  await Promise.all([query.fetch(), query.fetch()]);
  expect(mocks.fetch).toHaveBeenCalledOnce();
  expect(client.getQueryCache().getAll()).toHaveLength(1);
 });
 it("updates only the acknowledged owner's library and rejects failed folder writes", async () => {
  const folder: Awaited<ReturnType<typeof createTtsFolder>> = {
   id: "folder-1",
   user_id: "owner-1",
   name: "New",
   revision: 0,
   created_at: "2026-10-04T00:00:00Z",
   updated_at: "2026-10-04T00:00:00Z",
  };
  client.setQueryData(key, { folders: [], clips: [] });
  const otherKey = hanzihomeQueryKeys.ttsLibraryForUser("owner-2");
  client.setQueryData(otherKey, { folders: [], clips: [] });
  mocks.folder.mockResolvedValueOnce(folder).mockRejectedValueOnce(new Error("Failed"));
  const hook = controller();
  await hook.createFolder.mutateAsync("New");
  expect(client.getQueryData<Awaited<ReturnType<typeof fetchTtsLibrary>>>(key)?.folders).toEqual([
   folder,
  ]);
  expect(
   client.getQueryData<Awaited<ReturnType<typeof fetchTtsLibrary>>>(otherKey)?.folders,
  ).toEqual([]);
  await expect(hook.createFolder.mutateAsync("Unsaved")).rejects.toThrow("Failed");
  expect(client.getQueryData<Awaited<ReturnType<typeof fetchTtsLibrary>>>(key)?.folders).toEqual([
   folder,
  ]);
 });
});
