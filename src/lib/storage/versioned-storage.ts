import { JsonValueSchema, type JsonFieldValue } from "@/types/json";
import { z } from "zod";

const storageEnvelopeSchema = z.object({
 version: z.number().int().positive(),
 data: z.json(),
});
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

type VersionedStorageConfig<T> = {
 key: string;
 version: number;
 schema: z.ZodType<T>;
 fallback: T;
 migrateLegacy?: (value: JsonFieldValue) => Nullable<T>;
};

export function getBrowserStorage(): Nullable<Storage> {
 if (typeof window === "undefined") return null;

 try {
  return window.localStorage;
 } catch {
  return null;
 }
}

export function readVersionedStorage<T>(
 storage: Nullable<Storage>,
 config: VersionedStorageConfig<T>,
): T {
 if (!storage) return config.fallback;

 try {
  const raw = storage.getItem(config.key);
  if (!raw) return config.fallback;

  const value = JsonValueSchema.parse(JSON.parse(raw));
  const envelope = storageEnvelopeSchema.safeParse(value);
  if (envelope.success && envelope.data.version === config.version) {
   const parsed = config.schema.safeParse(envelope.data.data);
   return parsed.success ? parsed.data : config.fallback;
  }

  const migrated = config.migrateLegacy?.(value);
  if (migrated === null || migrated === undefined) return config.fallback;

  const parsed = config.schema.safeParse(migrated);
  return parsed.success ? parsed.data : config.fallback;
 } catch {
  return config.fallback;
 }
}

export function writeVersionedStorage<T>(
 storage: Nullable<Storage>,
 config: VersionedStorageConfig<T>,
 value: T,
) {
 if (!storage) return;

 const parsed = config.schema.safeParse(value);
 if (!parsed.success) return;

 try {
  storage.setItem(
   config.key,
   JSON.stringify({
    version: config.version,
    data: parsed.data,
   }),
  );
 } catch {
  // Persistence is optional when storage is blocked or full.
 }
}
