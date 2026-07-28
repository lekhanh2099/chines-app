import { describe, expect, it } from "vitest";

import {
 auditVocabularyDuplication,
 type VocabularyDuplicationItem,
 type VocabularyDuplicationSection,
 type VocabularyLessonDuplicationAudit,
} from "./audit-hanzihome-vocabulary-duplication";

const section: VocabularyDuplicationSection = {
 id: "section-1",
 lesson_id: "lesson-1",
 payload: {
  id: "vocabulary",
  type: "vocabulary",
  order: 2,
  title: "生词",
  title_vi: "Từ mới",
  items: [
   {
    id: "word-1",
    type: "vocabulary_item",
    order: 1,
    hanzi: "学习",
    pinyin: "xuéxí",
    meaning_vi: "học tập",
    meaning_en: "",
    pos: "verb",
    tags: ["core"],
    examples: [],
    audio_key: "",
    check_needed: false,
   },
  ],
 },
};

const normalizedItem: VocabularyDuplicationItem = {
 id: "word-1",
 lesson_id: "lesson-1",
 item_order: 1,
 word: "学习",
 pinyin: "xuéxí",
 meaning: "học tập",
 pos_vi: "verb",
 tags: ["core"],
};

function lessonAudit(report: ReturnType<typeof auditVocabularyDuplication>) {
 const audit = report.lessons[0];
 if (!audit) throw new Error("Expected one lesson audit");
 return audit satisfies VocabularyLessonDuplicationAudit;
}

describe("auditVocabularyDuplication", () => {
 it("marks a lesson removable only when IDs and core fields match", () => {
  const report = auditVocabularyDuplication([section], [normalizedItem]);
  const audit = lessonAudit(report);

  expect(audit.exact).toBe(true);
  expect(report.exactLessonCount).toBe(1);
  expect(report.removableBytes).toBeGreaterThan(0);
 });

 it("blocks removal when normalized vocabulary has a different ID set", () => {
  const report = auditVocabularyDuplication([section], [{ ...normalizedItem, id: "word-2" }]);
  const audit = lessonAudit(report);

  expect(audit.exact).toBe(false);
  expect(audit.countOrIdMismatch).toBe(true);
  expect(audit.missingNormalizedItemIds).toEqual(["word-1"]);
  expect(audit.extraNormalizedItemIds).toEqual(["word-2"]);
  expect(report.removableBytes).toBe(0);
 });

 it("reports field differences without treating them as an ID mismatch", () => {
  const report = auditVocabularyDuplication(
   [section],
   [{ ...normalizedItem, meaning: "nghiên cứu" }],
  );
  const audit = lessonAudit(report);

  expect(audit.exact).toBe(false);
  expect(audit.countOrIdMismatch).toBe(false);
  expect(audit.fieldMismatchItemIds).toEqual(["word-1"]);
  expect(report.fieldMismatchLessonCount).toBe(1);
 });
});
