import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";
import { getDictionaryEntryByHeadword, mapDictionaryEntryToVocabData } from "./vocab.service";
import type { DbDictionaryCore } from "@/types/database";
import type { Database } from "@/types/supabase.generated";

describe("mapDictionaryEntryToVocabData", () => {
 it("keeps stored definitions when embedded analysis only contains Hán Việt", () => {
  const entry: DbDictionaryCore = {
   id: "dictionary-entry",
   headword: "清楚",
   lookup_key: "清楚",
   pinyin: "qīngchu",
   sino_vietnamese: "THANH SỞ",
   lookup_count: 1,
   created_at: "2026-07-28T00:00:00.000Z",
   data: {
    definitions: [
     {
      part_of_speech: "tính từ",
      meaning: "rõ ràng; minh bạch",
      example: "",
     },
    ],
    ai_analysis: {
     han_viet: "THANH SỞ",
    },
   },
  };

  const vocab = mapDictionaryEntryToVocabData(entry);

  expect(vocab.sino_vietnamese).toBe("THANH SỞ");
  expect(vocab.meaning).toBe("rõ ràng; minh bạch");
  expect(vocab.ai_analysis?.definitions?.[0]?.meaning).toBe("rõ ràng; minh bạch");
 });
});

describe("getDictionaryEntryByHeadword", () => {
 it("treats an absent dictionary_core row as a cache miss without logging a schema error", async () => {
  const supabase = createClient<Database>("https://dictionary.test", "test-anon-key", {
   global: {
    fetch: async () =>
     new Response("[]", {
      status: 200,
      headers: { "content-type": "application/json" },
     }),
   },
  });
  const loggerError = vi.spyOn(logger, "error").mockImplementation(() => undefined);

  await expect(getDictionaryEntryByHeadword(supabase, "不存在")).resolves.toBeNull();
  expect(loggerError).not.toHaveBeenCalled();

  loggerError.mockRestore();
 });
});
