"use client";

import { z } from "zod";
import { JsonValueSchema, type JsonFieldValue } from "@/types/json";
import {
 getAllFromStoreMatching,
 HANZIHOME_LOCAL_STORES,
 promisifyRequest,
 readFromStore,
 replaceInStoreIf,
 runInLocalTransaction,
} from "./hanzihome-local-db";

export const ContentCacheResourceTypeSchema = z.enum(["lesson_detail", "lesson_vocab", "catalog"]);

export type ContentCacheResourceType = z.infer<typeof ContentCacheResourceTypeSchema>;

export const ContentCacheMetadataSchema = z.object({
 cachedAt: z.number(),
 lastAccessedAt: z.number(),
 byteSize: z.number(),
 accessCount: z.number(),
 generation: z.number().int().nonnegative().default(1),
 isPinned: z.boolean().default(false),
 deletedAt: z.number().int().nonnegative().optional(),
});

export type ContentCacheMetadata = z.infer<typeof ContentCacheMetadataSchema>;

export const ContentCacheRecordBaseSchema = z.object({
 key: z.string().min(1),
 ownerId: z.string().min(1),
 resourceType: ContentCacheResourceTypeSchema,
 resourceId: z.string().min(1),
 metadata: ContentCacheMetadataSchema,
 data: JsonValueSchema,
});

export type ContentCacheRecord<T = JsonFieldValue> = {
 key: string;
 ownerId: string;
 resourceType: ContentCacheResourceType;
 resourceId: string;
 metadata: ContentCacheMetadata;
 data: T;
};

export const MAX_CACHE_ENTRIES_PER_OWNER = 250;
export const TARGET_CACHE_ENTRIES_PER_OWNER = 200;

function isDeletedContentCacheRecord(
 record: z.output<typeof ContentCacheRecordBaseSchema>,
): boolean {
 return record.metadata.deletedAt !== undefined;
}

export function buildContentCacheKey(
 ownerId: string,
 resourceType: ContentCacheResourceType,
 resourceId: string,
): string {
 const safeOwner = ownerId.trim();
 const safeType = resourceType.trim();
 const safeId = resourceId.trim();
 if (!safeOwner || !safeType || !safeId) {
  throw new Error(
   `Invalid content cache coordinates: owner="${ownerId}", type="${resourceType}", id="${resourceId}"`,
  );
 }
 return `${safeOwner}:${safeType}:${safeId}`;
}

export function estimateContentByteSize(value: unknown): number {
 try {
  return new TextEncoder().encode(JSON.stringify(value)).length;
 } catch {
  return 0;
 }
}

export async function writeContentCache<T extends JsonFieldValue>(params: {
 ownerId: string;
 resourceType: ContentCacheResourceType;
 resourceId: string;
 data: T;
 incomingGeneration?: number;
 maxEntries?: number;
 pin?: boolean;
}): Promise<{ written: boolean; generation: number }> {
 const { ownerId, resourceType, resourceId, data, incomingGeneration } = params;
 const key = buildContentCacheKey(ownerId, resourceType, resourceId);
 const byteSize = estimateContentByteSize(data);

 const writeResult = await runInLocalTransaction(
  [HANZIHOME_LOCAL_STORES.contentCache],
  "readwrite",
  async (stores) => {
   const cacheStore = stores[HANZIHOME_LOCAL_STORES.contentCache];
   const rawExisting = await promisifyRequest(cacheStore.get(key));
   const parsedExisting = ContentCacheRecordBaseSchema.safeParse(rawExisting);
   const existing = parsedExisting.success ? parsedExisting.data : null;
   const currentGeneration = existing?.metadata.generation ?? 0;

   // The generation comparison and content write must share one transaction:
   // an eviction tombstone can otherwise be overtaken by a late fetch response.
   if (incomingGeneration !== undefined && currentGeneration > incomingGeneration) {
    return { written: false, generation: currentGeneration };
   }

   const now = Date.now();
   const nextGeneration = Math.max(currentGeneration, incomingGeneration ?? currentGeneration) + 1;
   const record: ContentCacheRecord<T> = {
    key,
    ownerId,
    resourceType,
    resourceId,
    metadata: {
     cachedAt: existing?.metadata.cachedAt ?? now,
     lastAccessedAt: now,
     byteSize,
     accessCount: (existing?.metadata.accessCount ?? 0) + 1,
     generation: nextGeneration,
     isPinned: params.pin ?? existing?.metadata.isPinned ?? false,
    },
    data,
   };
   cacheStore.put(record);
   return { written: true, generation: nextGeneration };
  },
 );

 if (!writeResult.written) return writeResult;

 const effectiveMax = params.maxEntries ?? MAX_CACHE_ENTRIES_PER_OWNER;
 const effectiveTarget = Math.floor(effectiveMax * 0.8);

 // Perform bounded eviction if needed
 await pruneContentCacheForOwner({
  ownerId,
  maxEntries: effectiveMax,
  targetEntries: effectiveTarget,
 }).catch(() => {
  // Non-fatal: eviction failure should not fail write
 });

 return writeResult;
}

export async function pinContentCache(
 ownerId: string,
 resourceType: ContentCacheResourceType,
 resourceId: string,
): Promise<boolean> {
 const key = buildContentCacheKey(ownerId, resourceType, resourceId);
 try {
  return await runInLocalTransaction(
   [HANZIHOME_LOCAL_STORES.contentCache],
   "readwrite",
   async (stores) => {
    const cacheStore = stores[HANZIHOME_LOCAL_STORES.contentCache];
    const rawExisting = await promisifyRequest(cacheStore.get(key));
    const parsedExisting = ContentCacheRecordBaseSchema.safeParse(rawExisting);
    if (!parsedExisting.success || isDeletedContentCacheRecord(parsedExisting.data)) return false;
    cacheStore.put({
     ...parsedExisting.data,
     metadata: { ...parsedExisting.data.metadata, isPinned: true },
    });
    return true;
   },
  );
 } catch {
  return false;
 }
}

export async function readContentCache<T>(params: {
 ownerId: string;
 resourceType: ContentCacheResourceType;
 resourceId: string;
 schema: z.ZodType<T>;
}): Promise<T | null> {
 const { ownerId, resourceType, resourceId, schema } = params;
 const key = buildContentCacheKey(ownerId, resourceType, resourceId);

 let rawRecord: z.infer<typeof ContentCacheRecordBaseSchema> | null = null;
 try {
  rawRecord = await readFromStore(
   HANZIHOME_LOCAL_STORES.contentCache,
   key,
   ContentCacheRecordBaseSchema,
  );
 } catch {
  return null;
 }

 if (!rawRecord) return null;

 // Enforce owner isolation guard
 if (rawRecord.ownerId !== ownerId) {
  return null;
 }

 if (isDeletedContentCacheRecord(rawRecord)) return null;

 const parsed = schema.safeParse(rawRecord.data);
 if (!parsed.success) {
  // Corrupted or drifted payload: safe self-healing by purging the bad entry
  await deleteContentCache(ownerId, resourceType, resourceId).catch(() => {});
  return null;
 }

 // Update lastAccessedAt and accessCount atomically without clobbering concurrent writes or resurrecting deletes
 const now = Date.now();
 replaceInStoreIf(
  HANZIHOME_LOCAL_STORES.contentCache,
  key,
  ContentCacheRecordBaseSchema,
  (current) => current.metadata.generation === rawRecord.metadata.generation,
  (current) => ({
   ...current,
   metadata: {
    ...current.metadata,
    lastAccessedAt: now,
    accessCount: current.metadata.accessCount + 1,
   },
  }),
 ).catch(() => {});

 return parsed.data;
}

export async function hasContentCache(
 ownerId: string,
 resourceType: ContentCacheResourceType,
 resourceId: string,
): Promise<boolean> {
 const safeOwner = ownerId.trim();
 const safeId = resourceId.trim();
 if (!safeOwner || !resourceType || !safeId) return false;
 try {
  const key = buildContentCacheKey(safeOwner, resourceType, safeId);
  const existing = await readFromStore(
   HANZIHOME_LOCAL_STORES.contentCache,
   key,
   ContentCacheRecordBaseSchema,
  );
  return existing !== null && !isDeletedContentCacheRecord(existing);
 } catch {
  return false;
 }
}

export async function getContentCacheGeneration(
 ownerId: string,
 resourceType: ContentCacheResourceType,
 resourceId: string,
): Promise<number> {
 const safeOwner = ownerId.trim();
 const safeId = resourceId.trim();
 if (!safeOwner || !resourceType || !safeId) return 0;
 try {
  const key = buildContentCacheKey(safeOwner, resourceType, safeId);
  const existing = await readFromStore(
   HANZIHOME_LOCAL_STORES.contentCache,
   key,
   ContentCacheRecordBaseSchema,
  );
  return existing?.metadata.generation ?? 0;
 } catch {
  return 0;
 }
}

export async function bumpContentCacheGeneration(
 ownerId: string,
 resourceType: ContentCacheResourceType,
 resourceId: string,
): Promise<number> {
 const safeOwner = ownerId.trim();
 const safeId = resourceId.trim();
 if (!safeOwner || !resourceType || !safeId) return 0;

 try {
  const key = buildContentCacheKey(safeOwner, resourceType, safeId);
  return await runInLocalTransaction(
   [HANZIHOME_LOCAL_STORES.contentCache],
   "readwrite",
   async (stores) => {
    const cacheStore = stores[HANZIHOME_LOCAL_STORES.contentCache];
    const rawExisting = await promisifyRequest(cacheStore.get(key));
    const parsedExisting = ContentCacheRecordBaseSchema.safeParse(rawExisting);
    const existing = parsedExisting.success ? parsedExisting.data : null;
    const now = Date.now();
    const generation = (existing?.metadata.generation ?? 0) + 1;
    const record: ContentCacheRecord<JsonFieldValue> = existing
     ? {
        ...existing,
        metadata: {
         ...existing.metadata,
         lastAccessedAt: now,
         generation,
        },
       }
     : {
        key,
        ownerId,
        resourceType,
        resourceId,
        metadata: {
         cachedAt: now,
         lastAccessedAt: now,
         byteSize: 0,
         accessCount: 0,
         generation,
         isPinned: false,
         deletedAt: now,
        },
        data: null,
       };
    cacheStore.put(record);
    return generation;
   },
  );
 } catch {
  return 0;
 }
}

export async function bumpLessonCacheGenerations(
 lessonId: string,
 ownerId?: string,
): Promise<void> {
 const safeLessonId = lessonId.trim();
 if (!safeLessonId) return;

 try {
  if (ownerId) {
   await Promise.all([
    bumpContentCacheGeneration(ownerId, "lesson_detail", safeLessonId),
    bumpContentCacheGeneration(ownerId, "lesson_vocab", safeLessonId),
   ]);
   return;
  }

  const allEntries = await getAllFromStoreMatching(
   HANZIHOME_LOCAL_STORES.contentCache,
   ContentCacheRecordBaseSchema,
  );
  for (const entry of allEntries) {
   if (entry.resourceId === safeLessonId) {
    await bumpContentCacheGeneration(entry.ownerId, entry.resourceType, entry.resourceId).catch(
     () => {},
    );
   }
  }
 } catch {
  // Non-fatal
 }
}

export async function deleteContentCache(
 ownerId: string,
 resourceType: ContentCacheResourceType,
 resourceId: string,
): Promise<void> {
 const key = buildContentCacheKey(ownerId, resourceType, resourceId);
 await runInLocalTransaction([HANZIHOME_LOCAL_STORES.contentCache], "readwrite", async (stores) => {
  const cacheStore = stores[HANZIHOME_LOCAL_STORES.contentCache];
  const rawExisting = await promisifyRequest(cacheStore.get(key));
  const parsedExisting = ContentCacheRecordBaseSchema.safeParse(rawExisting);
  const existing = parsedExisting.success ? parsedExisting.data : null;
  const now = Date.now();
  const tombstone: ContentCacheRecord<null> = {
   key,
   ownerId,
   resourceType,
   resourceId,
   metadata: {
    cachedAt: existing?.metadata.cachedAt ?? now,
    lastAccessedAt: now,
    byteSize: 0,
    accessCount: existing?.metadata.accessCount ?? 0,
    generation: (existing?.metadata.generation ?? 0) + 1,
    isPinned: false,
    deletedAt: now,
   },
   data: null,
  };
  cacheStore.put(tombstone);
 });
}

export async function clearContentCacheForOwner(ownerId: string): Promise<void> {
 const allEntries = await getAllFromStoreMatching(
  HANZIHOME_LOCAL_STORES.contentCache,
  ContentCacheRecordBaseSchema,
 );
 for (const entry of allEntries) {
  if (entry.ownerId === ownerId && !isDeletedContentCacheRecord(entry)) {
   await deleteContentCache(entry.ownerId, entry.resourceType, entry.resourceId).catch(() => {});
  }
 }
}

export async function getContentCacheFootprint(
 ownerId: string,
): Promise<{ entryCount: number; totalBytes: number }> {
 const allEntries = await getAllFromStoreMatching(
  HANZIHOME_LOCAL_STORES.contentCache,
  ContentCacheRecordBaseSchema,
 );

 let entryCount = 0;
 let totalBytes = 0;

 for (const entry of allEntries) {
  if (entry.ownerId === ownerId && !isDeletedContentCacheRecord(entry)) {
   entryCount++;
   totalBytes += entry.metadata.byteSize;
  }
 }

 return { entryCount, totalBytes };
}

export async function pruneContentCacheForOwner(params: {
 ownerId: string;
 maxEntries: number;
 targetEntries: number;
}): Promise<number> {
 const { ownerId, maxEntries, targetEntries } = params;
 const allEntries = await getAllFromStoreMatching(
  HANZIHOME_LOCAL_STORES.contentCache,
  ContentCacheRecordBaseSchema,
 );

 const ownerEntries = allEntries.filter(
  (entry) => entry.ownerId === ownerId && !isDeletedContentCacheRecord(entry),
 );

 if (ownerEntries.length <= maxEntries) {
  return 0;
 }

 // Sort LRU: oldest lastAccessedAt first
 ownerEntries.sort((a, b) => a.metadata.lastAccessedAt - b.metadata.lastAccessedAt);

 const entriesToEvictCount = ownerEntries.length - targetEntries;
 const candidates = ownerEntries
  .filter((entry) => !entry.metadata.isPinned)
  .slice(0, Math.max(1, entriesToEvictCount));

 let evicted = 0;
 for (const item of candidates) {
  await deleteContentCache(item.ownerId, item.resourceType, item.resourceId).catch(() => {});
  evicted += 1;
 }

 return evicted;
}
