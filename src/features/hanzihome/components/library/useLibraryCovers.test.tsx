import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { HanziHomeMutationError } from "@/features/hanzihome/editing/mutation-error";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import * as api from "./library-cover-api";
import { useResetLibraryCoverMutation, useSaveLibraryCoverMutation } from "./useLibraryCovers";

vi.mock("./library-cover-api");
let client: QueryClient;
const saves: ReturnType<typeof useSaveLibraryCoverMutation>[] = [];
const resets: ReturnType<typeof useResetLibraryCoverMutation>[] = [];
const cover = {
 collectionId: "group:hanyu",
 coverUrl: "https://images.example.test/cover.png",
 createdAt: "2026-10-20T09:00:00.000Z",
 updatedAt: "2026-10-20T09:00:00.000Z",
};

beforeEach(() => {
 vi.resetAllMocks();
 saves.length = 0;
 resets.length = 0;
 client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
 client.setQueryData(hanzihomeQueryKeys.libraryCovers, []);
 client.setQueryData(hanzihomeQueryKeys.catalogRoot, []);
 client.setQueryData(hanzihomeQueryKeys.learningState("learner-a"), { settings: {} });
 function Probe() {
  saves.push(useSaveLibraryCoverMutation());
  resets.push(useResetLibraryCoverMutation());
  return null;
 }
 renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)));
});
afterEach(() => client.clear());

it("invalidates only shared covers after an acknowledged save", async () => {
 const save = saves[0];
 if (!save) throw new Error("Missing cover mutation probe");
 vi.mocked(api.saveLibraryCover).mockResolvedValue(cover);
 await save.mutateAsync({ collectionId: cover.collectionId, input: { coverUrl: cover.coverUrl } });
 expect(client.getQueryState(hanzihomeQueryKeys.libraryCovers)?.isInvalidated).toBe(true);
 expect(client.getQueryState(hanzihomeQueryKeys.catalogRoot)?.isInvalidated).toBe(false);
 expect(client.getQueryState(hanzihomeQueryKeys.learningState("learner-a"))?.isInvalidated).toBe(
  false,
 );
});

it("refreshes a conflicting cover base without accepting a failed save", async () => {
 const save = saves[0];
 if (!save) throw new Error("Missing cover mutation probe");
 vi.mocked(api.saveLibraryCover).mockRejectedValue(new HanziHomeMutationError("Conflict", 409));
 await expect(
  save.mutateAsync({ collectionId: cover.collectionId, input: { coverUrl: cover.coverUrl } }),
 ).rejects.toThrow("Conflict");
 expect(client.getQueryState(hanzihomeQueryKeys.libraryCovers)?.isInvalidated).toBe(true);
 expect(client.getQueryState(hanzihomeQueryKeys.catalogRoot)?.isInvalidated).toBe(false);
});

it("refreshes covers after reset and preserves current cache on an ordinary failure", async () => {
 const reset = resets[0];
 if (!reset) throw new Error("Missing reset mutation probe");
 const input = { collectionId: cover.collectionId, input: { expectedUpdatedAt: cover.updatedAt } };
 vi.mocked(api.resetLibraryCover).mockRejectedValue(new HanziHomeMutationError("Unavailable", 503));
 await expect(reset.mutateAsync(input)).rejects.toThrow("Unavailable");
 expect(client.getQueryState(hanzihomeQueryKeys.libraryCovers)?.isInvalidated).toBe(false);
 vi
  .mocked(api.resetLibraryCover)
  .mockResolvedValue({ collectionId: cover.collectionId, reset: true });
 await reset.mutateAsync(input);
 expect(client.getQueryState(hanzihomeQueryKeys.libraryCovers)?.isInvalidated).toBe(true);
 expect(client.getQueryState(hanzihomeQueryKeys.catalogRoot)?.isInvalidated).toBe(false);
});
