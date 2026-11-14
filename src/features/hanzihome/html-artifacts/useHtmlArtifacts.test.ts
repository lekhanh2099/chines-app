import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "./html-artifact-api";
import type { HtmlArtifact, HtmlArtifactFolder, HtmlArtifactSummary } from "./html-artifact.schema";
import {
 useCreateHtmlArtifactFolderMutation,
 useCreateHtmlArtifactMutation,
 useDeleteHtmlArtifactFolderMutation,
 useDeleteHtmlArtifactMutation,
} from "./useHtmlArtifacts";

vi.mock("./html-artifact-api");

function createFixtureArtifact(overrides?: Partial<HtmlArtifact>): HtmlArtifact {
 return {
  id: "art-1",
  ownerId: "user-1",
  folderId: null,
  title: "Test Artifact",
  artifactType: "practice_page",
  tags: ["test"],
  html: "<div>test</div>",
  createdAt: "2026-09-10T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
  ...overrides,
 };
}

function createFixtureFolder(overrides?: Partial<HtmlArtifactFolder>): HtmlArtifactFolder {
 return {
  id: "folder-1",
  ownerId: "user-1",
  parentFolderId: null,
  name: "Folder 1",
  color: "blue",
  position: 0,
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

describe("useHtmlArtifacts optimistic & direct reconciliation", () => {
 let queryClient: QueryClient;
 const listKey = api.htmlArtifactsQueryKey;

 beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({
   defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
   },
  });
 });

 it("seeds created artifact into list and detail cache without full invalidation", async () => {
  const existing = createFixtureArtifact({ id: "art-1" });
  queryClient.setQueryData(listKey, { items: [existing], folders: [] });

  const newArt = createFixtureArtifact({ id: "art-2", title: "New Art" });
  vi.mocked(api.createHtmlArtifact).mockResolvedValue(newArt);

  const mutation = renderMutationProbe(queryClient, useCreateHtmlArtifactMutation);
  await mutation.mutateAsync({
   title: "New Art",
   artifactType: "practice_page",
   html: "<div>new</div>",
  });

  // Check list cache
  const listCache = queryClient.getQueryData<{
   items: HtmlArtifactSummary[];
   folders: HtmlArtifactFolder[];
  }>(listKey);
  expect(listCache?.items).toHaveLength(2);
  expect(listCache?.items[0]?.id).toBe("art-2");

  // Check detail cache
  const detailCache = queryClient.getQueryData<HtmlArtifact>([...listKey, "art-2"]);
  expect(detailCache?.title).toBe("New Art");
 });

 it("optimistically deletes artifact and restores on error", async () => {
  const art1 = createFixtureArtifact({ id: "art-1" });
  const art2 = createFixtureArtifact({ id: "art-2" });
  queryClient.setQueryData(listKey, { items: [art1, art2], folders: [] });

  let rejectApi: (err: Error) => void = () => {};
  vi.mocked(api.deleteHtmlArtifact).mockImplementation(
   () =>
    new Promise((_, reject) => {
     rejectApi = reject;
    }),
  );

  const mutation = renderMutationProbe(queryClient, useDeleteHtmlArtifactMutation);
  const promise = mutation.mutateAsync("art-1").catch(() => null);

  // Optimistically removed
  await vi.waitFor(() => {
   const listCache = queryClient.getQueryData<{
    items: HtmlArtifactSummary[];
    folders: HtmlArtifactFolder[];
   }>(listKey);
   expect(listCache?.items).toHaveLength(1);
   expect(listCache?.items[0]?.id).toBe("art-2");
  });

  // Fail request
  rejectApi(new Error("Delete failed"));
  await promise;

  // Restored to list
  const finalCache = queryClient.getQueryData<{
   items: HtmlArtifactSummary[];
   folders: HtmlArtifactFolder[];
  }>(listKey);
  expect(finalCache?.items).toHaveLength(2);
  expect(finalCache?.items[0]?.id).toBe("art-1");
  expect(finalCache?.items[1]?.id).toBe("art-2");
 });

 it("seeds created folder and optimistically deletes folder with rollback", async () => {
  const folder1 = createFixtureFolder({ id: "folder-1" });
  queryClient.setQueryData(listKey, { items: [], folders: [folder1] });

  // 1. Create folder
  const folder2 = createFixtureFolder({ id: "folder-2", name: "Folder 2" });
  vi.mocked(api.createHtmlArtifactFolder).mockResolvedValue(folder2);

  const createMutation = renderMutationProbe(queryClient, useCreateHtmlArtifactFolderMutation);
  await createMutation.mutateAsync({ name: "Folder 2" });

  const cacheWith2 = queryClient.getQueryData<{
   items: HtmlArtifactSummary[];
   folders: HtmlArtifactFolder[];
  }>(listKey);
  expect(cacheWith2?.folders).toHaveLength(2);

  // 2. Delete folder with error
  let rejectDelete: (err: Error) => void = () => {};
  vi.mocked(api.deleteHtmlArtifactFolder).mockImplementation(
   () =>
    new Promise((_, reject) => {
     rejectDelete = reject;
    }),
  );

  const deleteMutation = renderMutationProbe(queryClient, useDeleteHtmlArtifactFolderMutation);
  const promise = deleteMutation.mutateAsync("folder-1").catch(() => null);

  await vi.waitFor(() => {
   const cache = queryClient.getQueryData<{
    items: HtmlArtifactSummary[];
    folders: HtmlArtifactFolder[];
   }>(listKey);
   expect(cache?.folders).toHaveLength(1);
   expect(cache?.folders[0]?.id).toBe("folder-2");
  });

  rejectDelete(new Error("Folder delete failed"));
  await promise;

  const restoredCache = queryClient.getQueryData<{
   items: HtmlArtifactSummary[];
   folders: HtmlArtifactFolder[];
  }>(listKey);
  expect(restoredCache?.folders).toHaveLength(2);
  expect(restoredCache?.folders[0]?.id).toBe("folder-1");
 });
});
