import { z } from "zod";
import { describe, expect, it } from "vitest";

import { readVersionedStorage, writeVersionedStorage } from "./versioned-storage";

function createStorage(initial: Record<string, string> = {}): Storage {
 const values = new Map(Object.entries(initial));
 return {
  get length() {
   return values.size;
  },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => values.delete(key),
  setItem: (key, value) => values.set(key, value),
 };
}

const config = {
 key: "preferences",
 version: 1,
 schema: z.object({ enabled: z.boolean() }),
 fallback: { enabled: false },
 migrateLegacy: (value: unknown) => (typeof value === "boolean" ? { enabled: value } : null),
};

describe("versioned storage", () => {
 it("reads and writes a versioned payload", () => {
  const storage = createStorage();
  writeVersionedStorage(storage, config, { enabled: true });
  expect(readVersionedStorage(storage, config)).toEqual({ enabled: true });
 });

 it("migrates a valid legacy payload", () => {
  const storage = createStorage({ preferences: "true" });
  expect(readVersionedStorage(storage, config)).toEqual({ enabled: true });
 });

 it("falls back for malformed, unsupported, or unavailable storage", () => {
  expect(readVersionedStorage(createStorage({ preferences: "{" }), config)).toEqual(
   config.fallback,
  );
  expect(
   readVersionedStorage(
    createStorage({ preferences: JSON.stringify({ version: 2, data: { enabled: true } }) }),
    config,
   ),
  ).toEqual(config.fallback);
  expect(readVersionedStorage(null, config)).toEqual(config.fallback);
 });
});
