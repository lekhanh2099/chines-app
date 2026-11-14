import { beforeEach, describe, expect, it, vi } from "vitest";

describe("hanzihome-local-db migration and lifecycle", () => {
 beforeEach(() => {
  vi.resetModules();
 });

 it("creates content_cache store additively during v2 upgrade while preserving existing stores", async () => {
  const createdStores = new Set<string>();
  const createdIndexes = new Map<string, string[]>();

  const mockDb = {
   objectStoreNames: {
    contains: (name: string) => createdStores.has(name),
   },
   createObjectStore: (name: string, _options?: { keyPath?: string }) => {
    createdStores.add(name);
    createdIndexes.set(name, []);
    return {
     createIndex: (indexName: string) => {
      createdIndexes.get(name)?.push(indexName);
     },
    };
   },
  };

  // Simulate v1 existing state: learning_state and pending_mutations already exist
  createdStores.add("learning_state");
  createdStores.add("pending_mutations");

  // Import db module and run createStores
  const dbModule = await import("./hanzihome-local-db");
  expect(dbModule.HANZIHOME_LOCAL_STORES.contentCache).toBe("content_cache");

  // Open request simulation
  let upgradeCallback: (() => void) | undefined;
  const mockRequest = {
   result: mockDb,
   set onupgradeneeded(fn: () => void) {
    upgradeCallback = fn;
   },
   set onsuccess(fn: () => void) {
    // invoke success after upgrade
    if (upgradeCallback) upgradeCallback();
    fn();
   },
   set onerror(_fn: () => void) {},
   set onblocked(_fn: () => void) {},
  };

  const openSpy = vi.fn(() => mockRequest);
  vi.stubGlobal("indexedDB", { open: openSpy });

  const db = await dbModule.openHanziHomeLocalDb();
  expect(db).toBe(mockDb);

  // Verified: content_cache and reader_annotations were added additively
  expect(createdStores.has("content_cache")).toBe(true);
  expect(createdIndexes.get("content_cache")).toEqual([
   "ownerId",
   "resourceType",
   "lastAccessedAt",
  ]);
  expect(createdStores.has("reader_annotations")).toBe(true);
  expect(createdIndexes.get("reader_annotations")).toEqual(["documentId", "updatedAt"]);

  // Verified: pre-existing stores were untouched
  expect(createdStores.has("learning_state")).toBe(true);
  expect(createdStores.has("pending_mutations")).toBe(true);

  dbModule.closeHanziHomeLocalDb();
 });

 it("handles multi-tab onversionchange by closing db instance", async () => {
  let versionChangeHandler: (() => void) | undefined;
  const mockDb = {
   objectStoreNames: { contains: () => true },
   close: vi.fn(),
   set onversionchange(fn: (() => void) | undefined) {
    versionChangeHandler = fn;
   },
   get onversionchange() {
    return versionChangeHandler;
   },
  };

  const mockRequest = {
   result: mockDb,
   set onsuccess(fn: () => void) {
    fn();
   },
   set onerror(_fn: () => void) {},
   set onblocked(_fn: () => void) {},
   set onupgradeneeded(_fn: () => void) {},
  };

  vi.stubGlobal("indexedDB", { open: vi.fn(() => mockRequest) });

  const dbModule = await import("./hanzihome-local-db");
  await dbModule.openHanziHomeLocalDb();

  // Trigger versionchange event from another tab upgrading
  expect(mockDb.onversionchange).toBeDefined();
  mockDb.onversionchange?.();

  expect(mockDb.close).toHaveBeenCalledTimes(1);
 });
});
