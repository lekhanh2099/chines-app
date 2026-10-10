import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
 advanceNoteDraftRevision,
 clearNoteContentDraft,
 clearNoteReadingContentDraft,
 clearNoteDraft,
 closeNotesDraftDb,
 getNoteDraft,
 getOtherNoteDrafts,
 recoverNoteDraft,
 saveNoteDraft,
 type NoteDraftRecord,
} from "./note-draft-store";

describe("note-draft-store", () => {
 const inMemoryDrafts = new Map<string, NoteDraftRecord>();
 let abortNextTransaction = false;
 const writeRequestSucceeded = vi.fn<() => void>();

 type AsyncEventCallback = (() => void) | null;
 type MockRequest<T> = {
  result?: T;
  onsuccess: AsyncEventCallback;
  onerror: AsyncEventCallback;
  onupgradeneeded?: AsyncEventCallback;
 };

 function createMockRequest<T>(result?: T): MockRequest<T> {
  return {
   result,
   onsuccess: null,
   onerror: null,
   onupgradeneeded: null,
  };
 }

 beforeEach(() => {
  const sessionValues = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
   getItem: (key: string) => sessionValues.get(key) ?? null,
   setItem: (key: string, value: string) => sessionValues.set(key, value),
  });
  inMemoryDrafts.clear();
  abortNextTransaction = false;
  writeRequestSucceeded.mockClear();
  closeNotesDraftDb();

  const transactions: ReturnType<typeof createMockTx>[] = [];
  const mockStore = {
   index: () => ({
    getAll: (noteId: string) => {
     const request = createMockRequest(
      [...inMemoryDrafts.values()].filter((draft) => draft.noteId === noteId),
     );
     setTimeout(() => request.onsuccess?.(), 0);
     return request;
    },
   }),
   put: vi.fn((value: NoteDraftRecord) => {
    inMemoryDrafts.set(value.key, value);
    const req = createMockRequest<void>();
    const tx = transactions.at(-1);
    if (tx) tx.pendingRequests += 1;
    setTimeout(() => {
     writeRequestSucceeded();
     req.onsuccess?.();
     if (tx) {
      tx.pendingRequests -= 1;
      if (tx.pendingRequests === 0)
       setTimeout(() => (abortNextTransaction ? tx.onabort() : tx.oncomplete()), 0);
     }
    }, 0);
    return req;
   }),
   get: vi.fn((key: string) => {
    const result = inMemoryDrafts.get(key) ?? null;
    const req = createMockRequest<NoteDraftRecord | null>(result);
    const tx = transactions.at(-1);
    if (tx) tx.pendingRequests += 1;
    setTimeout(() => {
     req.onsuccess?.();
     if (tx) {
      tx.pendingRequests -= 1;
      if (tx.pendingRequests === 0)
       setTimeout(() => (abortNextTransaction ? tx.onabort() : tx.oncomplete()), 0);
     }
    }, 0);
    return req;
   }),
   delete: vi.fn((key: string) => {
    inMemoryDrafts.delete(key);
    const req = createMockRequest<void>();
    const tx = transactions.at(-1);
    if (tx) tx.pendingRequests += 1;
    setTimeout(() => {
     req.onsuccess?.();
     if (tx) {
      tx.pendingRequests -= 1;
      if (tx.pendingRequests === 0)
       setTimeout(() => (abortNextTransaction ? tx.onabort() : tx.oncomplete()), 0);
     }
    }, 0);
    return req;
   }),
  };

  function createMockTx() {
   return {
    pendingRequests: 0,
    objectStore: () => mockStore,
    onerror: null,
    oncomplete: vi.fn<() => void>(),
    onabort: vi.fn<() => void>(),
   };
  }

  const mockDb = {
   objectStoreNames: {
    contains: vi.fn(() => true),
   },
   transaction: vi.fn(() => {
    const tx = createMockTx();
    transactions.push(tx);
    return tx;
   }),
   close: vi.fn(),
  };

  const mockIndexedDB = {
   open: vi.fn(() => {
    const req = createMockRequest(mockDb);
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
   }),
  };

  vi.stubGlobal("indexedDB", mockIndexedDB);
 });

 afterEach(() => {
  closeNotesDraftDb();
  vi.unstubAllGlobals();
 });

 it("saves a valid note draft and reads it back", async () => {
  const saved = await saveNoteDraft("user-1", "note-123", {
   baseRevision: 0,
   content: { root: { children: [] } },
   readingContent: null,
  });
  expect(saved).toBe(true);

  const draft = await getNoteDraft("user-1", "note-123");
  expect(draft).not.toBeNull();
  expect(draft?.userId).toBe("user-1");
  expect(draft?.noteId).toBe("note-123");
  expect(draft?.content).toEqual({ root: { children: [] } });
  expect(typeof draft?.updatedAt).toBe("number");
 });

 it("does not acknowledge a write request whose transaction aborts after request success", async () => {
  abortNextTransaction = true;
  await expect(
   saveNoteDraft("user-1", "note-abort", { baseRevision: 0, content: { text: "not committed" } }),
  ).resolves.toBe(false);
  expect(writeRequestSucceeded).toHaveBeenCalledOnce();
 });

 it("isolates drafts between different users", async () => {
  await saveNoteDraft("user-1", "note-shared-id", { baseRevision: 0, content: { user: "one" } });
  await saveNoteDraft("user-2", "note-shared-id", { baseRevision: 0, content: { user: "two" } });

  const draftUser1 = await getNoteDraft("user-1", "note-shared-id");
  const draftUser2 = await getNoteDraft("user-2", "note-shared-id");

  expect(draftUser1?.content).toEqual({ user: "one" });
  expect(draftUser2?.content).toEqual({ user: "two" });
 });

 it("clears a note draft properly", async () => {
  await saveNoteDraft("user-1", "note-to-clear", { baseRevision: 0, content: { test: true } });

  const cleared = await clearNoteDraft("user-1", "note-to-clear");
  expect(cleared).toBe(true);

  const draft = await getNoteDraft("user-1", "note-to-clear");
  expect(draft).toBeNull();
 });

 it("A6 Invariant: preserves newer draft when clearNoteDraft called with older in-flight timestamp", async () => {
  // 1. Initial draft created
  await saveNoteDraft("user-1", "note-preserve", { baseRevision: 0, content: { version: "old" } });

  const initialDraft = await getNoteDraft("user-1", "note-preserve");
  expect(initialDraft).not.toBeNull();
  const initialUpdatedAt = initialDraft?.updatedAt ?? 0;

  // 2. Simulate user typing a newer draft while mutation was in flight
  await new Promise((resolve) => setTimeout(resolve, 10));
  await saveNoteDraft("user-1", "note-preserve", {
   baseRevision: 0,
   content: { version: "newer in-flight edit" },
  });

  const newerDraft = await getNoteDraft("user-1", "note-preserve");
  expect(newerDraft?.updatedAt).toBeGreaterThan(initialUpdatedAt);

  // 3. In-flight mutation completes and attempts to clear with its initial timestamp
  const clearResult = await clearNoteDraft("user-1", "note-preserve", initialUpdatedAt);
  expect(clearResult).toBe(false);

  // 4. Invariant: Newer draft is preserved!
  const preservedDraft = await getNoteDraft("user-1", "note-preserve");
  expect(preservedDraft).not.toBeNull();
  expect(preservedDraft?.content).toEqual({ version: "newer in-flight edit" });

  // 5. Subsequent save of the newer draft clears it successfully
  const finalClearResult = await clearNoteDraft(
   "user-1",
   "note-preserve",
   preservedDraft?.updatedAt,
  );
  expect(finalClearResult).toBe(true);
  expect(await getNoteDraft("user-1", "note-preserve")).toBeNull();
 });

 it("A6 Invariant: content acknowledgement preserves an older unsaved reading draft", async () => {
  await saveNoteDraft("user-1", "note-split", {
   baseRevision: 0,
   content: { value: "content draft" },
   readingContent: { value: "reading draft" },
  });

  const contentSaveStartedAt = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 10));
  await saveNoteDraft("user-1", "note-split", {
   baseRevision: 0,
   content: { value: "server content" },
   readingContent: { value: "reading still unsaved" },
   readingContentUpdatedAt: Date.now(),
  });

  expect(
   await clearNoteContentDraft("user-1", "note-split", contentSaveStartedAt, {
    value: "content draft",
   }),
  ).toBe(true);
  expect(await getNoteDraft("user-1", "note-split")).toMatchObject({
   content: null,
   readingContent: { value: "reading still unsaved" },
  });
 });

 it("keeps an existing pre-pane draft's reading content after content acknowledgement", async () => {
  inMemoryDrafts.set("user-1:legacy-note", {
   key: "user-1:legacy-note",
   userId: "user-1",
   noteId: "legacy-note",
   content: { value: "content draft" },
   readingContent: { value: "legacy reading draft" },
   updatedAt: 100,
  });
  const legacy = (await getOtherNoteDrafts("user-1", "legacy-note"))[0];
  if (!legacy) throw new Error("Legacy draft is unavailable");
  expect(await getNoteDraft("user-1", "legacy-note")).toBeNull();
  expect(await recoverNoteDraft("user-1", "legacy-note", legacy)).toBe(true);

  expect(
   await clearNoteContentDraft("user-1", "legacy-note", 100, { value: "content draft" }),
  ).toBe(true);
  expect(await getNoteDraft("user-1", "legacy-note")).toMatchObject({
   content: null,
   readingContent: { value: "legacy reading draft" },
   readingContentUpdatedAt: 100,
  });
  expect(inMemoryDrafts.get("user-1:legacy-note")).toEqual(legacy);
  expect(
   await clearNoteReadingContentDraft("user-1", "legacy-note", 100, {
    value: "legacy reading draft",
   }),
  ).toBe(true);
  expect(await getNoteDraft("user-1", "legacy-note")).toBeNull();
  expect(await getOtherNoteDrafts("user-1", "legacy-note")).toEqual([]);
 });

 it("returns false and null gracefully when userId or noteId is empty", async () => {
  const saveRes = await saveNoteDraft("", "note-1", { baseRevision: 0, content: {} });
  expect(saveRes).toBe(false);

  const getRes = await getNoteDraft("user-1", "");
  expect(getRes).toBeNull();

  const clearRes = await clearNoteDraft("", "");
  expect(clearRes).toBe(false);
 });
 it("advances only the acknowledged base and preserves newer edits and both panes", async () => {
  await saveNoteDraft("user-1", "note-cas", {
   baseRevision: 2,
   content: { text: "local" },
   readingContent: { text: "reading" },
  });
  await saveNoteDraft("user-1", "note-cas", {
   baseRevision: 3,
   content: { text: "newer" },
   contentUpdatedAt: Date.now(),
  });
  expect((await getNoteDraft("user-1", "note-cas"))?.baseRevision).toBe(2);
  expect(await advanceNoteDraftRevision("user-1", "note-cas", 1, 2)).toBe(false);
  expect(await advanceNoteDraftRevision("user-1", "note-cas", 2, 3)).toBe(true);
  expect(await getNoteDraft("user-1", "note-cas")).toMatchObject({
   baseRevision: 3,
   content: { text: "newer" },
   readingContent: { text: "reading" },
  });
  expect(await advanceNoteDraftRevision("user-2", "note-cas", 3, 4)).toBe(false);
 });
 it("keeps a legacy draft without a base revision until explicitly rebased", async () => {
  inMemoryDrafts.set("user-1:legacy", {
   key: "user-1:legacy",
   userId: "user-1",
   noteId: "legacy",
   content: { text: "legacy" },
   updatedAt: 100,
  });
  const legacy = (await getOtherNoteDrafts("user-1", "legacy"))[0];
  if (!legacy) throw new Error("Legacy draft is unavailable");
  expect(await recoverNoteDraft("user-1", "legacy", legacy)).toBe(true);
  await saveNoteDraft("user-1", "legacy", { baseRevision: 5, content: { text: "continued edit" } });
  expect((await getNoteDraft("user-1", "legacy"))?.baseRevision).toBeUndefined();
  expect(await advanceNoteDraftRevision("user-1", "legacy", 5, 6)).toBe(false);
  expect(await advanceNoteDraftRevision("user-1", "legacy", undefined, 5)).toBe(true);
  expect(await getNoteDraft("user-1", "legacy")).toMatchObject({
   baseRevision: 5,
   content: { text: "continued edit" },
  });
  expect(inMemoryDrafts.get("user-1:legacy")).toEqual(legacy);
 });
 it("does not replace a current draft or recover another account's draft", async () => {
  const source: NoteDraftRecord = {
   key: "user-1:recovery",
   userId: "user-1",
   noteId: "recovery",
   content: { text: "older" },
   updatedAt: 100,
  };
  inMemoryDrafts.set(source.key, source);
  expect(await getOtherNoteDrafts("user-2", "recovery")).toEqual([]);
  expect(await recoverNoteDraft("user-2", "recovery", source)).toBe(false);
  await saveNoteDraft("user-1", "recovery", { baseRevision: 3, content: { text: "current" } });
  expect(await recoverNoteDraft("user-1", "recovery", source)).toBe(false);
  expect((await getNoteDraft("user-1", "recovery"))?.content).toEqual({ text: "current" });
  inMemoryDrafts.set(source.key, { ...source, updatedAt: 101 });
  expect(await recoverNoteDraft("user-1", "recovery", source)).toBe(false);
 });
 it("acknowledges the recovered copy without deleting a newer source generation", async () => {
  const source: NoteDraftRecord = {
   key: "user-1:source-note",
   userId: "user-1",
   noteId: "source-note",
   content: { text: "source snapshot" },
   updatedAt: 100,
  };
  inMemoryDrafts.set(source.key, source);
  expect(await recoverNoteDraft("user-1", "source-note", source)).toBe(true);
  const newer = { ...source, content: { text: "newer source draft" }, updatedAt: 101 };
  inMemoryDrafts.set(source.key, newer);
  expect(await clearNoteContentDraft("user-1", "source-note", 100, source.content)).toBe(true);
  expect(await getNoteDraft("user-1", "source-note")).toBeNull();
  expect(await getOtherNoteDrafts("user-1", "source-note")).toEqual([newer]);
 });
});
