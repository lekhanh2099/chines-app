"use client";

import { z } from "zod";
import { JsonValueSchema, type JsonFieldValue } from "@/types/json";
import {
 deleteFromStore,
 deleteFromStoreIf,
 getAllFromStoreMatching,
 HANZIHOME_LOCAL_STORES,
 putInStore,
 readFromStore,
 replaceInStoreIf,
} from "./hanzihome-local-db";

export const ContentCacheResourceTypeSchema = z.enum(["lesson_detail", "lesson_vocab", "catalog"]);

export type ContentCacheResourceType = z.infer<typeof ContentCacheResourceTypeSchema>;

export const ContentCacheMetadataSchema = z.object({
 cachedAt: z.number(),
 lastAccessedAt: z.number(),
 byteSize: z.number(),
 accessCount: z.number(),
 generation: z.number().int().nonnegative().default(1),
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
}): Promise<{ written: boolean; generation: number }> {
 const { ownerId, resourceType, resourceId, data, incomingGeneration } = params;
 const key = buildContentCacheKey(ownerId, resourceType, resourceId);
 const now = Date.now();
 const byteSize = estimateContentByteSize(data);

 const existing = await readFromStore(
  HANZIHOME_LOCAL_STORES.contentCache,
  key,
  ContentCacheRecordBaseSchema,
 );

 const currentGeneration = existing?.metadata.generation ?? 0;

 // Stale resurrection guard:
 // If incomingGeneration is specified, reject writes if cache has advanced past this generation.
 if (existing && incomingGeneration !== undefined && currentGeneration > incomingGeneration) {
  return { written: false, generation: currentGeneration };
 }

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
  },
  data,
 };

 await putInStore(HANZIHOME_LOCAL_STORES.contentCache, record);

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

 return { written: true, generation: nextGeneration };
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

 const parsed = schema.safeParse(rawRecord.data);
 if (!parsed.success) {
  // Corrupted or drifted payload: safe self-healing by purging the bad entry
  await deleteFromStore(HANZIHOME_LOCAL_STORES.contentCache, key).catch(() => {});
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
  return existing !== null;
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
  const existing = await readFromStore(
   HANZIHOME_LOCAL_STORES.contentCache,
   key,
   ContentCacheRecordBaseSchema,
  );
  if (!existing) return 0;

  const updated = await replaceInStoreIf(
   HANZIHOME_LOCAL_STORES.contentCache,
   key,
   ContentCacheRecordBaseSchema,
   (current) => current.metadata.generation === existing.metadata.generation,
   (current) => ({
    ...current,
    metadata: {
     ...current.metadata,
     lastAccessedAt: Date.now(),
     generation: current.metadata.generation + 1,
    },
   }),
  );
  return updated?.metadata.generation ?? existing.metadata.generation;
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
  const allEntries = await getAllFromStoreMatching(
   HANZIHOME_LOCAL_STORES.contentCache,
   ContentCacheRecordBaseSchema,
  );
  for (const entry of allEntries) {
   if (entry.resourceId === safeLessonId && (!ownerId || entry.ownerId === ownerId)) {
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
 await deleteFromStore(HANZIHOME_LOCAL_STORES.contentCache, key);
}

export async function clearContentCacheForOwner(ownerId: string): Promise<void> {
 await deleteFromStoreIf(
  HANZIHOME_LOCAL_STORES.contentCache,
  "",
  ContentCacheRecordBaseSchema,
  (record) => record.ownerId === ownerId,
 );

 // Also prune any lingering items matching ownerId by scanning all entries
 const allEntries = await getAllFromStoreMatching(
  HANZIHOME_LOCAL_STORES.contentCache,
  ContentCacheRecordBaseSchema,
 );
 for (const entry of allEntries) {
  if (entry.ownerId === ownerId) {
   await deleteFromStore(HANZIHOME_LOCAL_STORES.contentCache, entry.key).catch(() => {});
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
  if (entry.ownerId === ownerId) {
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

 const ownerEntries = allEntries.filter((entry) => entry.ownerId === ownerId);

 if (ownerEntries.length <= maxEntries) {
  return 0;
 }

 // Sort LRU: oldest lastAccessedAt first
 ownerEntries.sort((a, b) => a.metadata.lastAccessedAt - b.metadata.lastAccessedAt);

 const entriesToEvictCount = ownerEntries.length - targetEntries;
 const candidates = ownerEntries.slice(0, Math.max(1, entriesToEvictCount));

 let evicted = 0;
 for (const item of candidates) {
  await deleteFromStore(HANZIHOME_LOCAL_STORES.contentCache, item.key).catch(() => {});
  evicted++;
 }

 return evicted;
}
