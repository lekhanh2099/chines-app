import { describe, expect, it } from "vitest";

import { mapDictionaryEntryToVocabData } from "./vocab.service";
import type { DbDictionaryCore } from "@/types/database";

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
