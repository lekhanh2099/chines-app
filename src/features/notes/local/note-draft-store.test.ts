import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearNoteDraft, closeNotesDraftDb, getNoteDraft, saveNoteDraft } from "./note-draft-store";

describe("note-draft-store", () => {
 const inMemoryDrafts = new Map<string, unknown>();

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
  inMemoryDrafts.clear();
  closeNotesDraftDb();

  const mockStore = {
   put: vi.fn((value: { key: string }) => {
    inMemoryDrafts.set(value.key, value);
    const req = createMockRequest<void>();
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
   }),
   get: vi.fn((key: string) => {
    const result = inMemoryDrafts.get(key) ?? null;
    const req = createMockRequest<unknown>(result);
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
   }),
   delete: vi.fn((key: string) => {
    inMemoryDrafts.delete(key);
    const req = createMockRequest<void>();
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
   }),
  };

  const mockTx = {
   objectStore: vi.fn(() => mockStore),
   onerror: null,
  };

  const mockDb = {
   objectStoreNames: {
    contains: vi.fn(() => true),
   },
   transaction: vi.fn(() => mockTx),
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

 it("isolates drafts between different users", async () => {
  await saveNoteDraft("user-1", "note-shared-id", {
   content: { user: "one" },
  });
  await saveNoteDraft("user-2", "note-shared-id", {
   content: { user: "two" },
  });

  const draftUser1 = await getNoteDraft("user-1", "note-shared-id");
  const draftUser2 = await getNoteDraft("user-2", "note-shared-id");

  expect(draftUser1?.content).toEqual({ user: "one" });
  expect(draftUser2?.content).toEqual({ user: "two" });
 });

 it("clears a note draft properly", async () => {
  await saveNoteDraft("user-1", "note-to-clear", {
   content: { test: true },
  });

  const cleared = await clearNoteDraft("user-1", "note-to-clear");
  expect(cleared).toBe(true);

  const draft = await getNoteDraft("user-1", "note-to-clear");
  expect(draft).toBeNull();
 });

 it("A6 Invariant: preserves newer draft when clearNoteDraft called with older in-flight timestamp", async () => {
  // 1. Initial draft created
  await saveNoteDraft("user-1", "note-preserve", {
   content: { version: "old" },
  });

  const initialDraft = await getNoteDraft("user-1", "note-preserve");
  expect(initialDraft).not.toBeNull();
  const initialUpdatedAt = initialDraft?.updatedAt ?? 0;

  // 2. Simulate user typing a newer draft while mutation was in flight
  await new Promise((resolve) => setTimeout(resolve, 10));
  await saveNoteDraft("user-1", "note-preserve", {
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

 it("returns false and null gracefully when userId or noteId is empty", async () => {
  const saveRes = await saveNoteDraft("", "note-1", { content: {} });
  expect(saveRes).toBe(false);

  const getRes = await getNoteDraft("user-1", "");
  expect(getRes).toBeNull();

  const clearRes = await clearNoteDraft("", "");
  expect(clearRes).toBe(false);
 });
});
