import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { useClientSession } from "@/components/providers/QueryProvider";
import type { Database } from "@/types/supabase.generated";
import type {
 NoteDetail,
 NoteFolder,
 getNoteById,
 updateNoteFolder,
 createNote,
 createNoteFolder,
 deleteNoteFolder,
} from "@/services/notes/notes.service";
import type { getNoteDraft } from "../local/note-draft-store";
import { noteQueryKeys } from "../query-keys";
import { usePrefetchNote } from "./useNotesList";
import { useNoteFolderMutations } from "./useNoteLibrary";
import { useCreateNote, useCreateQuickNote, useImportNote } from "./useCreateNote";
import type { getClientSessionUser } from "@/lib/supabase/client-session";

const mocks = vi.hoisted(() => ({
 getNoteById: vi.fn<typeof getNoteById>(),
 getDraft: vi.fn<typeof getNoteDraft>(),
 updateFolder: vi.fn<typeof updateNoteFolder>(),
 createNote: vi.fn<typeof createNote>(),
 createFolder: vi.fn<typeof createNoteFolder>(),
 deleteFolder: vi.fn<typeof deleteNoteFolder>(),
 sessionUser: vi.fn<typeof getClientSessionUser>(),
}));
const session: Pick<ReturnType<typeof useClientSession>, "userId"> = { userId: "owner-a" };
const supabase = createClient<Database>("http://127.0.0.1:43197", "fixture-key", {
 auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ supabase, user: null, userId: session.userId, isResolved: true }),
}));
vi.mock("@/lib/supabase/client-session", () => ({ getClientSessionUser: mocks.sessionUser }));
vi.mock(import("@/services/notes/notes.service"), async (importOriginal) => ({
 ...(await importOriginal()),
 getNoteById: mocks.getNoteById,
 updateNoteFolder: mocks.updateFolder,
 createNote: mocks.createNote,
 createNoteFolder: mocks.createFolder,
 deleteNoteFolder: mocks.deleteFolder,
}));
vi.mock(import("../local/note-draft-store"), async (importOriginal) => ({
 ...(await importOriginal()),
 getNoteDraft: mocks.getDraft,
}));

function fixtureNote(owner = "owner-a"): NoteDetail {
 return {
  id: "note",
  user_id: owner,
  title: "Server title",
  category: "general",
  tags: [],
  content: { text: "server" },
  reading_content: { text: "reading" },
  folder_id: null,
  split_view_enabled: true,
  reading_status: null,
  linked_lesson_id: null,
  is_published: false,
  status: "draft",
  short_id: null,
  source_url: null,
  source_host: null,
  source_label: null,
  source_author: null,
  source_published_at: null,
  source_captured_at: null,
  revision: 8,
  created_at: "2026-10-10T00:00:00Z",
  updated_at: "2026-10-10T00:00:00Z",
  links: [],
 };
}
function folder(id: string, position: number): NoteFolder {
 return {
  id,
  userId: "owner-a",
  parentId: null,
  name: id,
  color: "purple",
  position,
  createdAt: "2026-10-10T00:00:00Z",
  updatedAt: "2026-10-10T00:00:00Z",
 };
}

// Captures real Query commands; does not claim mounted React/effect coverage.
function commands(client: QueryClient) {
 const captures: {
  prefetch: ReturnType<typeof usePrefetchNote>;
  folders: ReturnType<typeof useNoteFolderMutations>;
  create: ReturnType<typeof useCreateNote>;
  importNote: ReturnType<typeof useImportNote>;
  quick: ReturnType<typeof useCreateQuickNote>;
 }[] = [];
 function Probe() {
  captures.push({
   prefetch: usePrefetchNote(),
   folders: useNoteFolderMutations(),
   create: useCreateNote(),
   importNote: useImportNote(),
   quick: useCreateQuickNote(),
  });
  return null;
 }
 renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)));
 const value = captures[0];
 if (!value) throw new Error("Missing hook commands");
 return value;
}

let client: QueryClient;
beforeEach(() => {
 vi.resetAllMocks();
 session.userId = "owner-a";
 mocks.getDraft.mockResolvedValue(null);
 mocks.getNoteById.mockResolvedValue(fixtureNote());
 mocks.updateFolder.mockImplementation(async (_client, id, changes) =>
  folder(id, changes.position ?? 0),
 );
 mocks.createNote.mockResolvedValue(fixtureNote());
 mocks.createFolder.mockImplementation(async (_client, owner, input) => ({
  ...folder(input.name, 0),
  userId: owner,
  name: input.name,
  parentId: input.parentId ?? null,
  color: input.color ?? "purple",
 }));
 mocks.sessionUser.mockResolvedValue({
  id: "owner-a",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-10T00:00:00Z",
 });
 client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
 });
});
afterEach(() => {
 client.clear();
 onlineManager.setOnline(true);
});
async function settled(owner = "owner-a") {
 await vi.waitFor(() =>
  expect(client.getQueryState(noteQueryKeys.detail(owner, "note"))?.fetchStatus).toBe("idle"),
 );
}

describe("note prefetch", () => {
 it("deduplicates pending hover/pointer requests and reuses fresh owner data", async () => {
  let finish = () => {};
  mocks.getNoteById.mockImplementation(
   () =>
    new Promise((resolve) => {
     finish = () => resolve(fixtureNote());
    }),
  );
  const { prefetch } = commands(client);
  prefetch("note");
  prefetch("note");
  expect(mocks.getNoteById).toHaveBeenCalledTimes(1);
  finish();
  await settled();
  prefetch("note");
  await settled();
  expect(mocks.getNoteById).toHaveBeenCalledTimes(1);
  expect(client.getQueryData(noteQueryKeys.detail("owner-a", "note"))).toEqual(fixtureNote());
  client.setQueryData(noteQueryKeys.detail("owner-a", "note"), fixtureNote(), {
   updatedAt: Date.now() - 61000,
  });
  mocks.getNoteById.mockResolvedValue(fixtureNote());
  prefetch("note");
  await settled();
  expect(mocks.getNoteById).toHaveBeenCalledTimes(2);
 });

 it("restores both draft panes and base revision without replacing server metadata", async () => {
  mocks.getDraft.mockResolvedValue({
   key: "owner-a:note",
   userId: "owner-a",
   noteId: "note",
   content: { text: "draft" },
   readingContent: null,
   baseRevision: 6,
   updatedAt: 1,
  });
  commands(client).prefetch("note");
  await settled();
  expect(client.getQueryData(noteQueryKeys.detail("owner-a", "note"))).toEqual({
   ...fixtureNote(),
   content: { text: "draft" },
   reading_content: null,
   revision: 6,
  });
  expect(mocks.getDraft).toHaveBeenCalledWith("owner-a", "note");
 });

 it("falls back on unavailable draft storage and skips draft I/O for an absent server note", async () => {
  mocks.getDraft.mockRejectedValue(new Error("Storage unavailable"));
  commands(client).prefetch("note");
  await settled();
  expect(client.getQueryData(noteQueryKeys.detail("owner-a", "note"))).toEqual(fixtureNote());
  client.removeQueries();
  mocks.getDraft.mockClear();
  mocks.getNoteById.mockResolvedValue(null);
  commands(client).prefetch("note");
  await settled();
  expect(client.getQueryData(noteQueryKeys.detail("owner-a", "note"))).toBeNull();
  expect(mocks.getDraft).not.toHaveBeenCalled();
 });

 it("keeps held old-owner callbacks in their owner cache and suppresses signed-out I/O", async () => {
  let finish = () => {};
  mocks.getNoteById.mockImplementation(
   (_client, _id, owner) =>
    new Promise((resolve) => {
     finish = () => resolve(fixtureNote(owner));
    }),
  );
  const old = commands(client).prefetch;
  old("note");
  session.userId = "owner-b";
  mocks.getNoteById.mockResolvedValue(fixtureNote("owner-b"));
  commands(client).prefetch("note");
  await settled("owner-b");
  finish();
  await settled();
  expect(client.getQueryData(noteQueryKeys.detail("owner-a", "note"))).toEqual(fixtureNote());
  expect(client.getQueryData(noteQueryKeys.detail("owner-b", "note"))).toEqual(
   fixtureNote("owner-b"),
  );
  session.userId = null;
  mocks.getNoteById.mockClear();
  mocks.getDraft.mockClear();
  commands(client).prefetch("note");
  expect(mocks.getNoteById).not.toHaveBeenCalled();
  expect(mocks.getDraft).not.toHaveBeenCalled();
 });

 it("retains failed request status and recovers on a subsequent prefetch", async () => {
  mocks.getNoteById.mockRejectedValue(new Error("Network failed"));
  const { prefetch } = commands(client);
  prefetch("note");
  await settled();
  expect(client.getQueryState(noteQueryKeys.detail("owner-a", "note"))?.status).toBe("error");
  expect(mocks.getDraft).not.toHaveBeenCalled();
  mocks.getNoteById.mockResolvedValue(fixtureNote());
  prefetch("note");
  await settled();
  expect(client.getQueryState(noteQueryKeys.detail("owner-a", "note"))?.status).toBe("success");
 });
});

describe("folder write commands", () => {
 it("retains cached folders until create acknowledgement and propagates a failed rename", async () => {
  const original = folder("existing", 0);
  const saved = folder("created", 1);
  client.setQueryData(noteQueryKeys.folders("owner-a"), [original]);
  client.setQueryData(noteQueryKeys.list("owner-a"), [fixtureNote()]);
  let release = () => {};
  mocks.createFolder.mockImplementation(
   () =>
    new Promise((resolve) => {
     release = () => resolve(saved);
    }),
  );
  const mutations = commands(client).folders;
  const input: Parameters<typeof createNoteFolder>[2] = {
   name: "created",
   parentId: null,
   color: "purple",
   position: 1,
  };
  const pending = mutations.createMutation.mutateAsync(input);
  await vi.waitFor(() => expect(mocks.createFolder).toHaveBeenCalledOnce());
  expect(mocks.createFolder).toHaveBeenCalledWith(supabase, "owner-a", input);
  expect(client.getQueryData(noteQueryKeys.folders("owner-a"))).toEqual([original]);
  expect(client.getQueryState(noteQueryKeys.folders("owner-a"))?.isInvalidated).toBe(false);
  release();
  await expect(pending).resolves.toEqual(saved);
  expect(client.getQueryState(noteQueryKeys.folders("owner-a"))?.isInvalidated).toBe(true);
  expect(client.getQueryState(noteQueryKeys.list("owner-a"))?.isInvalidated).toBe(false);
  client.setQueryData(noteQueryKeys.folders("owner-a"), [original]);
  mocks.updateFolder.mockRejectedValue(new Error("Rename failed"));
  await expect(
   mutations.updateMutation.mutateAsync({ folderId: original.id, changes: { name: "renamed" } }),
  ).rejects.toThrow("Rename failed");
  expect(client.getQueryData(noteQueryKeys.folders("owner-a"))).toEqual([original]);
  expect(client.getQueryState(noteQueryKeys.folders("owner-a"))?.isInvalidated).toBe(false);
 });

 it("refreshes folders and notes only after delete acknowledgement and retains both on failure", async () => {
  const original = folder("existing", 0);
  const note = { ...fixtureNote(), folder_id: original.id };
  client.setQueryData(noteQueryKeys.folders("owner-a"), [original]);
  client.setQueryData(noteQueryKeys.list("owner-a"), [note]);
  const mutations = commands(client).folders;
  mocks.deleteFolder.mockRejectedValue(new Error("Delete failed"));
  await expect(mutations.deleteMutation.mutateAsync(original.id)).rejects.toThrow("Delete failed");
  expect(client.getQueryState(noteQueryKeys.folders("owner-a"))?.isInvalidated).toBe(false);
  expect(client.getQueryState(noteQueryKeys.list("owner-a"))?.isInvalidated).toBe(false);
  let release = () => {};
  mocks.deleteFolder.mockImplementation(
   () =>
    new Promise((resolve) => {
     release = () => resolve();
    }),
  );
  const pending = mutations.deleteMutation.mutateAsync(original.id);
  await vi.waitFor(() => expect(mocks.deleteFolder).toHaveBeenCalledTimes(2));
  expect(client.getQueryData(noteQueryKeys.folders("owner-a"))).toEqual([original]);
  expect(client.getQueryData(noteQueryKeys.list("owner-a"))).toEqual([note]);
  expect(client.getQueryState(noteQueryKeys.folders("owner-a"))?.isInvalidated).toBe(false);
  expect(client.getQueryState(noteQueryKeys.list("owner-a"))?.isInvalidated).toBe(false);
  release();
  await pending;
  expect(mocks.deleteFolder).toHaveBeenLastCalledWith(supabase, original.id);
  expect(client.getQueryState(noteQueryKeys.folders("owner-a"))?.isInvalidated).toBe(true);
  expect(client.getQueryState(noteQueryKeys.list("owner-a"))?.isInvalidated).toBe(true);
 });

 it("rejects signed-out create, rename and delete before service calls", async () => {
  session.userId = null;
  const mutations = commands(client).folders;
  await expect(mutations.createMutation.mutateAsync({ name: "New" })).rejects.toThrow(
   "Not authenticated",
  );
  await expect(
   mutations.updateMutation.mutateAsync({ folderId: "existing", changes: { name: "New" } }),
  ).rejects.toThrow("Not authenticated");
  await expect(mutations.deleteMutation.mutateAsync("existing")).rejects.toThrow(
   "Not authenticated",
  );
  expect(mocks.createFolder).not.toHaveBeenCalled();
  expect(mocks.updateFolder).not.toHaveBeenCalled();
  expect(mocks.deleteFolder).not.toHaveBeenCalled();
 });
});

describe("folder move commands", () => {
 it("swaps positions, invalidates folders and waits for both acknowledgements", async () => {
  const first = folder("first", 2);
  const last = folder("last", 8);
  client.setQueryData(noteQueryKeys.folders("owner-a"), [first, last]);
  let finish = () => {};
  mocks.updateFolder.mockImplementation(async (_client, id, changes) =>
   id === "first"
    ? new Promise((resolve) => {
       finish = () => resolve(folder(id, changes.position ?? 0));
      })
    : folder(id, changes.position ?? 0),
  );
  let complete = false;
  const move = commands(client)
   .folders.moveFolder(first, [last, first], false)
   .then(() => {
    complete = true;
   });
  await vi.waitFor(() => expect(mocks.updateFolder).toHaveBeenCalledTimes(2));
  expect(complete).toBe(false);
  expect(mocks.updateFolder).toHaveBeenCalledWith(supabase, "first", { position: 8 });
  expect(mocks.updateFolder).toHaveBeenCalledWith(supabase, "last", { position: 2 });
  finish();
  await move;
  expect(client.getQueryState(noteQueryKeys.folders("owner-a"))?.isInvalidated).toBe(true);
 });

 it("surfaces a partial write failure and never describes the existing pair as atomic", async () => {
  const first = folder("first", 0);
  const last = folder("last", 1);
  mocks.updateFolder.mockImplementation(async (_client, id, changes) => {
   if (id === "last") throw new Error("Second write failed");
   return folder(id, changes.position ?? 0);
  });
  await expect(commands(client).folders.moveFolder(first, [first, last], false)).rejects.toThrow(
   "Second write failed",
  );
  expect(mocks.updateFolder).toHaveBeenCalledTimes(2);
 });

 it("does nothing at sibling boundaries and rejects signed-out moves before service I/O", async () => {
  const first = folder("first", 0);
  const last = folder("last", 1);
  const { folders } = commands(client);
  await folders.moveFolder(first, [first, last], true);
  await folders.moveFolder(last, [first, last], false);
  expect(mocks.updateFolder).not.toHaveBeenCalled();
  session.userId = null;
  await expect(commands(client).folders.moveFolder(first, [first, last], false)).rejects.toThrow(
   "Not authenticated",
  );
  expect(mocks.updateFolder).not.toHaveBeenCalled();
 });
});

describe("create/import Query commands", () => {
 const body = {
  version: 2,
  note: {
   title: "Imported",
   tags: ["中文"],
   category: "culture",
   content: { text: "body" },
   readingContent: { text: "reading" },
   splitViewEnabled: true,
   readingStatus: "reading",
   folder: { name: "Child", parentName: "Parent", color: "blue" },
  },
 };
 function file() {
  return new File([JSON.stringify(body)], "note.json", { type: "application/json" });
 }

 it("invalidates the existing list after actual create acknowledgement and rejects missing sessions", async () => {
  client.setQueryData(noteQueryKeys.list("owner-a"), []);
  const input: Parameters<typeof createNote>[2] = { title: "New", tags: [] };
  const create = commands(client).create;
  await expect(create.mutateAsync(input)).resolves.toEqual(fixtureNote());
  expect(mocks.createNote).toHaveBeenCalledWith(supabase, "owner-a", input);
  expect(client.getQueryState(noteQueryKeys.list("owner-a"))?.isInvalidated).toBe(true);
  mocks.createNote.mockResolvedValue(null);
  await expect(create.mutateAsync(input)).rejects.toThrow("Failed to create note");
  session.userId = null;
  mocks.createNote.mockClear();
  await expect(commands(client).create.mutateAsync(input)).rejects.toThrow("Not authenticated");
  await expect(commands(client).importNote.mutateAsync(file())).rejects.toThrow(
   "Not authenticated",
  );
  expect(mocks.createNote).not.toHaveBeenCalled();
  expect(mocks.createFolder).not.toHaveBeenCalled();
 });

 it("reuses exact existing parent/child folders and preserves the imported payload", async () => {
  const parent = { ...folder("p", 0), name: "Parent" };
  const child = { ...folder("c", 1), name: "Child", parentId: "p" };
  client.setQueryData(noteQueryKeys.folders("owner-a"), [child, parent]);
  await commands(client).importNote.mutateAsync(file());
  expect(mocks.createFolder).not.toHaveBeenCalled();
  expect(mocks.createNote).toHaveBeenCalledWith(supabase, "owner-a", {
   title: "Imported",
   tags: ["中文"],
   category: "culture",
   content: { text: "body" },
   readingContent: { text: "reading" },
   splitViewEnabled: true,
   readingStatus: "reading",
   source: null,
   folderId: "c",
  });
 });

 it("awaits parent then child then note, keeping the starting owner through a held file read", async () => {
  let releaseFile = () => {};
  const input = file();
  vi.spyOn(input, "text").mockImplementation(
   () =>
    new Promise((resolve) => {
     releaseFile = () => resolve(JSON.stringify(body));
    }),
  );
  let releaseParent = () => {};
  mocks.createFolder.mockImplementation(async (_client, owner, value) =>
   value.name === "Parent"
    ? new Promise((resolve) => {
       releaseParent = () => resolve({ ...folder("p", 0), userId: owner, name: value.name });
      })
    : { ...folder("c", 1), userId: owner, parentId: value.parentId ?? null, name: value.name },
  );
  mocks.createNote.mockResolvedValue(fixtureNote());
  client.setQueryData(noteQueryKeys.folders("owner-a"), []);
  client.setQueryData(noteQueryKeys.list("owner-a"), []);
  client.setQueryData(noteQueryKeys.list("owner-b"), []);
  let complete = false;
  const pending = commands(client)
   .importNote.mutateAsync(input)
   .then(() => {
    complete = true;
   });
  await vi.waitFor(() => expect(input.text).toHaveBeenCalledOnce());
  session.userId = "owner-b";
  releaseFile();
  await vi.waitFor(() => expect(mocks.createFolder).toHaveBeenCalledTimes(1));
  expect(mocks.createNote).not.toHaveBeenCalled();
  expect(complete).toBe(false);
  releaseParent();
  await pending;
  expect(mocks.createFolder.mock.calls.map((call) => [call[1], call[2]])).toEqual([
   ["owner-a", { name: "Parent", color: "blue" }],
   ["owner-a", { name: "Child", parentId: "p", color: "blue" }],
  ]);
  expect(mocks.createNote).toHaveBeenCalledWith(
   supabase,
   "owner-a",
   expect.objectContaining({ folderId: "c" }),
  );
  expect(client.getQueryState(noteQueryKeys.folders("owner-a"))?.isInvalidated).toBe(true);
  expect(client.getQueryState(noteQueryKeys.list("owner-a"))?.isInvalidated).toBe(true);
  expect(client.getQueryState(noteQueryKeys.list("owner-b"))?.isInvalidated).toBe(false);
 });

 it("stops after a partial folder failure and propagates a failed final note acknowledgement", async () => {
  mocks.createFolder.mockImplementation(async (_client, _owner, input) => {
   if (input.parentId) throw new Error("Child failed");
   return folder("p", 0);
  });
  const importNote = commands(client).importNote;
  await expect(importNote.mutateAsync(file())).rejects.toThrow("Child failed");
  expect(mocks.createFolder).toHaveBeenCalledTimes(2);
  expect(mocks.createNote).not.toHaveBeenCalled();
  mocks.createFolder.mockRejectedValue(new Error("Parent failed"));
  mocks.createFolder.mockClear();
  await expect(importNote.mutateAsync(file())).rejects.toThrow("Parent failed");
  expect(mocks.createFolder).toHaveBeenCalledOnce();
  expect(mocks.createNote).not.toHaveBeenCalled();
  mocks.createFolder.mockImplementation(async (_client, _owner, input) => ({
   ...folder(input.name, 0),
   parentId: input.parentId ?? null,
  }));
  mocks.createNote.mockResolvedValue(null);
  await expect(importNote.mutateAsync(file())).rejects.toThrow("Failed to create note");
 });

 it("rejects malformed inputs before writes and imports legacy v1 without inventing folders", async () => {
  const importNote = commands(client).importNote;
  await expect(importNote.mutateAsync(new File(["not json"], "bad.json"))).rejects.toThrow();
  await expect(importNote.mutateAsync(new File(["{}"], "bad.json"))).rejects.toThrow();
  expect(mocks.createFolder).not.toHaveBeenCalled();
  expect(mocks.createNote).not.toHaveBeenCalled();
  await importNote.mutateAsync(
   new File(
    [JSON.stringify({ version: 1, note: { title: "Legacy", content: {} } })],
    "legacy.json",
   ),
  );
  expect(mocks.createFolder).not.toHaveBeenCalled();
  expect(mocks.createNote).toHaveBeenCalledWith(supabase, "owner-a", {
   title: "Legacy",
   tags: [],
   category: "general",
   content: {},
   readingContent: null,
   splitViewEnabled: undefined,
   folderId: null,
   readingStatus: null,
   source: null,
  });
 });
});

describe("quick-create command", () => {
 it("returns guest outcome without generating a title or writing a note", async () => {
  mocks.sessionUser.mockResolvedValue(null);
  const title = vi.fn(() => "Quick title");
  await expect(commands(client).quick.mutateAsync(title)).resolves.toBeNull();
  expect(mocks.sessionUser).toHaveBeenCalledWith(supabase);
  expect(title).not.toHaveBeenCalled();
  expect(mocks.createNote).not.toHaveBeenCalled();
 });
 it("awaits fresh session then creates the current title and invalidates only the acknowledged owner", async () => {
  let releaseSession = () => {};
  mocks.sessionUser.mockImplementation(
   () =>
    new Promise((resolve) => {
     releaseSession = () =>
      resolve({
       id: "fresh-owner",
       aud: "authenticated",
       app_metadata: {},
       user_metadata: {},
       created_at: "2026-10-10T00:00:00Z",
      });
    }),
  );
  mocks.createNote.mockResolvedValue(fixtureNote("fresh-owner"));
  client.setQueryData(noteQueryKeys.list("owner-a"), []);
  client.setQueryData(noteQueryKeys.list("fresh-owner"), []);
  const title = vi.fn(() => "After session resolution");
  let complete = false;
  const pending = commands(client)
   .quick.mutateAsync(title)
   .then(() => {
    complete = true;
   });
  await vi.waitFor(() => expect(mocks.sessionUser).toHaveBeenCalledOnce());
  expect(complete).toBe(false);
  expect(title).not.toHaveBeenCalled();
  releaseSession();
  await pending;
  expect(title).toHaveBeenCalledOnce();
  expect(mocks.createNote).toHaveBeenCalledWith(supabase, "fresh-owner", {
   title: "After session resolution",
   tags: ["quick-note"],
   content: expect.any(Object),
  });
  expect(client.getQueryState(noteQueryKeys.list("fresh-owner"))?.isInvalidated).toBe(true);
  expect(client.getQueryState(noteQueryKeys.list("owner-a"))?.isInvalidated).toBe(false);
 });
 it("attempts direct writes offline and rejects failed acknowledgement instead of queuing success", async () => {
  onlineManager.setOnline(false);
  mocks.createNote.mockResolvedValue(null);
  await expect(commands(client).quick.mutateAsync(() => "Offline title")).rejects.toThrow(
   "Failed to create note",
  );
  expect(mocks.createNote).toHaveBeenCalledOnce();
  mocks.createNote.mockRejectedValue(new Error("Write failed"));
  await expect(commands(client).quick.mutateAsync(() => "Retry title")).rejects.toThrow(
   "Write failed",
  );
  expect(mocks.createNote).toHaveBeenCalledTimes(2);
 });
});
