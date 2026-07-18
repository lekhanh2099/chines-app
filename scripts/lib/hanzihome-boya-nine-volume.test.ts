import { describe, expect, it } from "vitest";

import type { HanziHomeSeedData } from "./hanzihome-supabase-seed";
import { remapPortableLessonIds } from "./hanzihome-supabase-seed";
import { normalizeBoyaVocabularyDuplicates } from "./hanzihome-boya-nine-volume";

describe("Boya nine-volume portable adapter", () => {
 it("moves lesson, nested and advanced vocabulary IDs into the additive namespace", () => {
  expect(
   remapPortableLessonIds(
    {
     id: "boya-advanced-v1-l02-section-1",
     vocab_refs: ["q1-b2-gu-gu"],
     source_file: "Boya cao cấp.docx",
    },
    "boya-advanced-v1-l02",
    "boya-9e-advanced-1-l02",
   ),
  ).toEqual({
   id: "boya-9e-advanced-1-l02-section-1",
   vocab_refs: ["boya-9e-advanced-1-l02-v-gu-gu"],
   source_file: "Boya cao cấp.docx",
  });
 });

 it("keeps the richer row when a synthetic vocabulary item duplicates the same lesson key", () => {
  const shared = {
   lesson_id: "boya-9e-advanced-2-l10",
   course_id: "boya-nine-volume-second-edition",
   book_id: "boya-9e-advanced-2",
   owner_id: null,
   source: "seed" as const,
   word: "角落",
   pinyin: "jiǎoluò",
   meaning: "góc, ngóc ngách",
   meaning_en: null,
   category: "Từ vựng toàn bài",
   level: null,
   pos_vi: "Danh từ",
   pos_zh: null,
   tone: null,
   source_file: "Boya cao cấp.docx",
   imported_at: "2026-07-18T00:00:00.000Z",
  };
  const seed: HanziHomeSeedData = {
   datasets: [],
   courses: [],
   books: [],
   lessons: [],
   lessonSections: [],
   lessonTexts: [],
   vocabItems: [
    {
     ...shared,
     id: "rich",
     item_order: 23,
     han_viet: "giác lạc",
     tags: ["boya-advanced"],
    },
    {
     ...shared,
     id: "synthetic",
     item_order: 43,
     han_viet: "",
     tags: [],
    },
   ],
   vocabExamples: [
    {
     id: "rich-example",
     vocab_item_id: "rich",
     lesson_id: shared.lesson_id,
     owner_id: null,
     source: "seed",
     example_order: 1,
     zh: "每个角落",
     pinyin: null,
     vi: "mọi ngóc ngách",
     note: null,
     imported_at: shared.imported_at,
    },
   ],
   vocabDetailSections: [],
   grammarPoints: [],
   grammarExamples: [],
   grammarDetailSections: [],
   radicals: [],
  };

  const normalized = normalizeBoyaVocabularyDuplicates(seed);

  expect(normalized.seed.vocabItems.map((item) => item.id)).toEqual(["rich"]);
  expect(normalized.seed.vocabExamples).toHaveLength(1);
  expect(normalized.report).toMatchObject({
   sourceCount: 2,
   normalizedCount: 1,
   removed: [{ removedId: "synthetic", keptId: "rich" }],
  });
 });
});
