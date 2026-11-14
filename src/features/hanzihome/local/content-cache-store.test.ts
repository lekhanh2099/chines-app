import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { JsonFieldValue } from "@/types/json";
import type { ContentCacheRecord } from "./content-cache-store";

type CachedRecord = ContentCacheRecord<JsonFieldValue>;

type ContentCacheMockStore = {
 get: (key: string) => { result: CachedRecord | null };
 put: (value: CachedRecord) => void;
 delete: (key: string) => void;
};

type ContentCacheMockStores = {
 content_cache: ContentCacheMockStore;
};

const storage = new Map<string, Map<string, CachedRecord>>();

function getStoreMap(name: string) {
 let map = storage.get(name);
 if (!map) {
  map = new Map<string, CachedRecord>();
  storage.set(name, map);
 }
 return map;
}

function createContentCacheStore(name: string): ContentCacheMockStore {
 return {
  get: (key: string) => ({ result: getStoreMap(name).get(key) ?? null }),
  put: (value: CachedRecord) => {
   getStoreMap(name).set(value.key, value);
  },
  delete: (key: string) => {
   getStoreMap(name).delete(key);
  },
 };
}

vi.mock("./hanzihome-local-db", () => ({
 HANZIHOME_LOCAL_STORES: {
  learningState: "learning_state",
  pendingMutations: "pending_mutations",
  contentCache: "content_cache",
 },
 readFromStore: vi.fn((name: string, key: string) => {
  return Promise.resolve(getStoreMap(name).get(key) ?? null);
 }),
 replaceInStoreIf: vi.fn(
  (
   name: string,
   key: string,
   _schema: z.ZodType<CachedRecord>,
   matches: (value: CachedRecord) => boolean,
   replace: (value: CachedRecord) => CachedRecord,
  ) => {
   const map = getStoreMap(name);
   const current = map.get(key);
   if (current === undefined || !matches(current)) {
    return Promise.resolve(null);
   }
   const next = replace(current);
   map.set(key, next);
   return Promise.resolve(next);
  },
 ),
 getAllFromStoreMatching: vi.fn((name: string) => {
  return Promise.resolve(Array.from(getStoreMap(name).values()));
 }),
 promisifyRequest: vi.fn(<T>(request: { result: T }) => Promise.resolve(request.result)),
 runInLocalTransaction: vi.fn(
  async <T>(
   _storeNames: string[],
   _mode: string,
   operation: (stores: ContentCacheMockStores) => Promise<T> | T,
  ): Promise<T> =>
   operation({
    content_cache: createContentCacheStore("content_cache"),
   }),
 ),
}));

import {
 buildContentCacheKey,
 bumpContentCacheGeneration,
 bumpLessonCacheGenerations,
 clearContentCacheForOwner,
 deleteContentCache,
 getContentCacheFootprint,
 getContentCacheGeneration,
 hasContentCache,
 pinContentCache,
 pruneContentCacheForOwner,
 readContentCache,
 writeContentCache,
} from "./content-cache-store";

describe("content-cache-store", () => {
 beforeEach(() => {
  storage.clear();
  vi.clearAllMocks();
 });

 const sampleLessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  words: z.array(z.string()),
 });

 const sampleLessonData = {
  id: "lesson-1",
  title: "Bài 1: Chào hỏi",
  words: ["你好", "谢谢"],
 };

 it("builds consistent owner-scoped cache keys", () => {
  const key = buildContentCacheKey("user-123", "lesson_detail", "lesson-1");
  expect(key).toBe("user-123:lesson_detail:lesson-1");

  expect(() => buildContentCacheKey("", "lesson_detail", "lesson-1")).toThrow();
  expect(() => buildContentCacheKey("user-123", "lesson_detail", "")).toThrow();
 });

 it("writes and reads cached content with metadata", async () => {
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: sampleLessonData,
  });

  const cached = await readContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   schema: sampleLessonSchema,
  });

  expect(cached).toEqual(sampleLessonData);

  const footprint = await getContentCacheFootprint("user-123");
  expect(footprint.entryCount).toBe(1);
  expect(footprint.totalBytes).toBeGreaterThan(0);
 });

 it("enforces strict owner isolation", async () => {
  await writeContentCache({
   ownerId: "user-alice",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: sampleLessonData,
  });

  // User Bob attempts to read Alice's cached resource
  const bobResult = await readContentCache({
   ownerId: "user-bob",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   schema: sampleLessonSchema,
  });

  expect(bobResult).toBeNull();

  // Alice can still read her own cached resource
  const aliceResult = await readContentCache({
   ownerId: "user-alice",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   schema: sampleLessonSchema,
  });

  expect(aliceResult).toEqual(sampleLessonData);
 });

 it("safely handles corrupted/drifted cache records without crashing and self-heals", async () => {
  // Write invalid data that does not match sampleLessonSchema
  const storeMap = getStoreMap("content_cache");
  const corruptKey = "user-123:lesson_detail:lesson-broken";
  storeMap.set(corruptKey, {
   key: corruptKey,
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-broken",
   metadata: {
    cachedAt: Date.now(),
    lastAccessedAt: Date.now(),
    byteSize: 10,
    accessCount: 1,
    generation: 1,
    isPinned: false,
   },
   data: { wrongField: true }, // Missing required fields
  });

  const result = await readContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-broken",
   schema: sampleLessonSchema,
  });

  // Returns null safely
  expect(result).toBeNull();
  // Self-healing leaves a generation tombstone so a late response cannot revive it.
  expect(storeMap.get(corruptKey)).toEqual(
   expect.objectContaining({
    metadata: expect.objectContaining({ deletedAt: expect.any(Number) }),
   }),
  );
 });

 it("deletes cached content individually and for entire owner", async () => {
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: sampleLessonData,
  });
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_vocab",
   resourceId: "lesson-1",
   data: { words: ["你好"] },
  });
  await writeContentCache({
   ownerId: "user-456",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: sampleLessonData,
  });

  // Delete single item
  await deleteContentCache("user-123", "lesson_detail", "lesson-1");
  const readDeleted = await readContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   schema: sampleLessonSchema,
  });
  expect(readDeleted).toBeNull();

  // Clear user-123's entire cache
  await clearContentCacheForOwner("user-123");
  const user123Footprint = await getContentCacheFootprint("user-123");
  expect(user123Footprint.entryCount).toBe(0);

  // user-456 remains intact
  const user456Footprint = await getContentCacheFootprint("user-456");
  expect(user456Footprint.entryCount).toBe(1);
 });

 it("enforces bounded LRU eviction policy", async () => {
  const storeMap = getStoreMap("content_cache");

  // Seed 5 items for user-123 with ascending timestamps
  for (let i = 1; i <= 5; i++) {
   const key = `user-123:lesson_detail:lesson-${i}`;
   storeMap.set(key, {
    key,
    ownerId: "user-123",
    resourceType: "lesson_detail",
    resourceId: `lesson-${i}`,
    metadata: {
     cachedAt: 1000 + i * 100,
     lastAccessedAt: 1000 + i * 100,
     byteSize: 100,
     accessCount: 1,
     generation: 1,
     isPinned: false,
    },
    data: { id: `lesson-${i}`, title: `Lesson ${i}`, words: [] },
   });
  }

  // Prune with maxEntries=4, targetEntries=3
  const evictedCount = await pruneContentCacheForOwner({
   ownerId: "user-123",
   maxEntries: 4,
   targetEntries: 3,
  });

  expect(evictedCount).toBe(2);
  // Oldest items (lesson-1 and lesson-2) should be evicted behind tombstones.
  expect(storeMap.get("user-123:lesson_detail:lesson-1")).toEqual(
   expect.objectContaining({
    metadata: expect.objectContaining({ deletedAt: expect.any(Number) }),
   }),
  );
  expect(storeMap.get("user-123:lesson_detail:lesson-2")).toEqual(
   expect.objectContaining({
    metadata: expect.objectContaining({ deletedAt: expect.any(Number) }),
   }),
  );
  // Newer items should remain
  expect(storeMap.has("user-123:lesson_detail:lesson-3")).toBe(true);
  expect(storeMap.has("user-123:lesson_detail:lesson-4")).toBe(true);
  expect(storeMap.has("user-123:lesson_detail:lesson-5")).toBe(true);
 });

 it("tracks generations and rejects stale in-flight writes (stale resurrection prevention)", async () => {
  const v1Data = { ...sampleLessonData, title: "Bài 1 (v1)" };
  const v2Data = { ...sampleLessonData, title: "Bài 1 (v2 - Edited)" };

  // 1. Initial cached state (v1)
  const write1 = await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: v1Data,
  });
  expect(write1.written).toBe(true);
  expect(write1.generation).toBe(1);

  // 2. Slow GET starts and reads current generation (1)
  const startGen = await getContentCacheGeneration("user-123", "lesson_detail", "lesson-1");
  expect(startGen).toBe(1);

  // 3. User performs an edit, producing v2 with bumped generation (2)
  const write2 = await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: v2Data,
  });
  expect(write2.written).toBe(true);
  expect(write2.generation).toBe(2);

  // 4. Late GET v1 finishes and tries to write with incomingGeneration = 1
  const lateWrite = await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: v1Data,
   incomingGeneration: startGen,
  });

  // Stale write is rejected!
  expect(lateWrite.written).toBe(false);
  expect(lateWrite.generation).toBe(2);

  // 5. DB retains v2
  const current = await readContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   schema: sampleLessonSchema,
  });
  expect(current).toEqual(v2Data);
 });

 it("bumps cache generations for a lesson on demand", async () => {
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: sampleLessonData,
  });
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_vocab",
   resourceId: "lesson-1",
   data: { words: ["你好"] },
  });

  const genBefore = await getContentCacheGeneration("user-123", "lesson_detail", "lesson-1");
  expect(genBefore).toBe(1);

  await bumpLessonCacheGenerations("lesson-1", "user-123");

  const genAfter = await getContentCacheGeneration("user-123", "lesson_detail", "lesson-1");
  expect(genAfter).toBe(2);
  const vocabGenAfter = await getContentCacheGeneration("user-123", "lesson_vocab", "lesson-1");
  expect(vocabGenAfter).toBe(2);
 });

 it("bumps cache generation for a specific resource coordinate", async () => {
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-99",
   data: sampleLessonData,
  });

  const nextGen = await bumpContentCacheGeneration("user-123", "lesson_detail", "lesson-99");
  expect(nextGen).toBe(2);

  const readGen = await getContentCacheGeneration("user-123", "lesson_detail", "lesson-99");
  expect(readGen).toBe(2);
 });

 it("A4 Invariant: readContentCache does not resurrect deleted entries or clobber newer generations", async () => {
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: sampleLessonData,
  });

  // Case 1: Entry is deleted concurrently after readFromStore but before metadata update
  // Simulate readContentCache read, then concurrent deletion
  const cached = await readContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   schema: sampleLessonSchema,
  });
  expect(cached).toEqual(sampleLessonData);

  // Now explicitly delete
  await deleteContentCache("user-123", "lesson_detail", "lesson-1");
  expect(await hasContentCache("user-123", "lesson_detail", "lesson-1")).toBe(false);

  // Verify that background touch does not resurrect the deleted entry
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(await hasContentCache("user-123", "lesson_detail", "lesson-1")).toBe(false);

  // Case 2: Concurrent write advances generation, background touch does not clobber
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: { ...sampleLessonData, title: "Version 1" },
  });

  // Start a read
  const v1Read = await readContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   schema: sampleLessonSchema,
  });
  expect(v1Read?.title).toBe("Version 1");

  // Another tab writes Version 2
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: { ...sampleLessonData, title: "Version 2" },
  });

  // Verify store retains Version 2 and was not overwritten by stale Version 1 touch
  const current = await readContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   schema: sampleLessonSchema,
  });
  expect(current?.title).toBe("Version 2");
 });

 it("A5 Invariant: deletion tombstone rejects a late response that began before eviction", async () => {
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: sampleLessonData,
  });
  const startedGeneration = await getContentCacheGeneration(
   "user-123",
   "lesson_detail",
   "lesson-1",
  );

  await deleteContentCache("user-123", "lesson_detail", "lesson-1");
  const lateWrite = await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "lesson-1",
   data: { ...sampleLessonData, title: "Stale response" },
   incomingGeneration: startedGeneration,
  });

  expect(lateWrite.written).toBe(false);
  expect(await hasContentCache("user-123", "lesson_detail", "lesson-1")).toBe(false);
 });

 it("A7 Invariant: ordinary cache writes do not evict an offline-pack-pinned lesson", async () => {
  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "offline-lesson",
   data: sampleLessonData,
  });
  expect(await pinContentCache("user-123", "lesson_detail", "offline-lesson")).toBe(true);

  await writeContentCache({
   ownerId: "user-123",
   resourceType: "lesson_detail",
   resourceId: "ordinary-lesson",
   data: { ...sampleLessonData, id: "ordinary-lesson" },
   maxEntries: 1,
  });

  expect(await hasContentCache("user-123", "lesson_detail", "offline-lesson")).toBe(true);
 });
});
