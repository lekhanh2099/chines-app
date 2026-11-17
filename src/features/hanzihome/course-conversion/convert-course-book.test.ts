import { describe, expect, it } from "vitest";

import {
 parsePracticeExerciseItem,
 splitBusinessChineseExercise,
 splitBusinessChineseGrammarExample,
 splitPipePhraseDrill,
} from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import type { JsonValue } from "@/types/json";

import { convertCourseBooks } from "./convert-course-book";
import { courseExportSchema } from "./course-export.schema";

const LESSON_ID = "lesson-uuid-1";

function section(sectionType: string, order: number, payload: JsonValue) {
 return {
  id: `section-${sectionType}`,
  lesson_id: LESSON_ID,
  section_type: sectionType,
  title: sectionType,
  title_vi: "",
  section_order: order,
  payload,
  deleted_at: null,
 };
}

const dialogueText = {
 id: "t1",
 type: "text_dialogue",
 order: 2,
 title: "田芳去哪儿了",
 title_vi: "Điền Phương đi đâu rồi?",
 lines: [
  {
   id: "l2",
   order: 2,
   speaker: "玛丽",
   zh: "她出去了。",
   pinyin: "Tā chūqu le.",
   vi: "Cô ấy ra ngoài rồi.",
  },
  {
   id: "l1",
   order: 1,
   speaker: "张东",
   zh: "田芳在吗？",
   pinyin: "Tián Fāng zài ma?",
   vi: "Điền Phương có ở đây không?",
  },
 ],
};

const narrativeText = {
 id: "t2",
 type: "text_narrative",
 order: 1,
 title: "一封信",
 title_vi: "Một bức thư",
 paragraphs: [
  {
   id: "p1",
   order: 1,
   zh: "**昨天**我给山本打电话。",
   pinyin: "Zuótiān…",
   vi: "Hôm qua tôi gọi điện cho Yamamoto.",
  },
 ],
 comprehension_questions: [{ id: "cq1", question: "“我”给谁打电话？", answer: "给山本打电话。" }],
};

const exercises = [
 {
  id: "ex-choice",
  type: "multiple_choice",
  order: 1,
  title: "一、选择正确答案",
  title_vi: "Chọn đáp án đúng",
  instruction: { zh: "选择正确答案。", vi: "Chọn đáp án đúng." },
  questions: [
   {
    id: "q1",
    prompt: "学生____就应该好好儿学习。",
    choices: [
     { id: "q1-a", text: "本来" },
     { id: "q1-b", text: "原来" },
    ],
    answer: "q1-a",
    explanation_vi: "本来 = vốn dĩ.",
   },
  ],
 },
 {
  id: "ex-bank",
  type: "choose_words_fill_blank",
  order: 2,
  title: "二、选词填空",
  word_bank: ["才", "就", "还"],
  questions: [
   { id: "b1", prompt: "他昨天晚上九点______回来。" },
   { id: "b2", prompt: "我下了课＿＿＿去医院。" },
  ],
  answer_key: [
   { question_id: "b2", answer: "就" },
   { question_id: "b1", answer: "才" },
  ],
 },
 {
  id: "ex-open",
  type: "complete_sentence",
  order: 3,
  title: "三、完成句子",
  questions: [{ id: "o1", prompt: "要是你来，就________。" }],
 },
 {
  id: "ex-ref",
  type: "reading_fill_blank",
  order: 4,
  title: "四、综合填空",
  reading_ref: "reading_01",
 },
];

const grammar = {
 id: "g",
 type: "grammar",
 items: [
  {
   id: "gp1",
   type: "grammar_point",
   order: 1,
   title: "动作的完成：动词 + 了",
   title_vi: "Động tác hoàn thành",
   blocks: [
    {
     id: "gb1",
     type: "grammar_structure",
     order: 1,
     title: "Khẳng định",
     pattern: "主语 + 动词 + 了 + 宾语",
     meaning_vi: "Ai đó đã làm xong một việc.",
     formulas: [{ label: "Phủ định", pattern: "S + 没 + V + O" }],
     examples: [
      {
       id: "e1",
       zh: "我买了一本书。",
       pinyin: "Wǒ mǎi le yì běn shū.",
       vi: "Tôi đã mua một quyển sách.",
      },
     ],
    },
   ],
  },
 ],
};

const courseExport = courseExportSchema.parse({
 books: [
  {
   id: "hanyu-q2-shang",
   course_id: "hanyu-q2",
   title: "Hán ngữ 2 Thượng",
   short_title: "Quyển 2 Thượng",
   book_order: 1,
  },
  {
   id: "boya-elementary-2",
   course_id: "boya-elementary",
   title: "Boya",
   short_title: null,
   book_order: 2,
  },
 ],
 lessons: [
  {
   id: LESSON_ID,
   book_id: "hanyu-q2-shang",
   lesson_number: 1,
   lesson_order: 1,
   title_zh: "田芳去哪儿了",
   title_vi: "Điền Phương đi đâu rồi?",
  },
  {
   id: "deleted",
   book_id: "hanyu-q2-shang",
   lesson_number: 2,
   lesson_order: 2,
   title_zh: "删",
   title_vi: null,
   deleted_at: "2026-01-01",
  },
 ],
 sections: [
  section("exercises", 6, { type: "exercises", items: exercises }),
  section("text", 1, { type: "text", blocks: [narrativeText, dialogueText] }),
  section("grammar", 4, grammar),
  section("proper_nouns", 3, {
   items: [{ hanzi: "上海", pinyin: "Shànghǎi", meaning_vi: "Thượng Hải" }],
  }),
 ],
 texts: [],
 vocabItems: [
  {
   id: "v2",
   lesson_id: LESSON_ID,
   item_order: 2,
   word: "出去",
   pinyin: "chūqu",
   han_viet: "xuất khứ",
   meaning: "ra ngoài",
   pos_vi: null,
   pos_zh: "动",
  },
  {
   id: "v1",
   lesson_id: LESSON_ID,
   item_order: 1,
   word: "在",
   pinyin: "zài",
   han_viet: "tại",
   meaning: "ở",
   pos_vi: "Động từ",
   pos_zh: "动",
  },
 ],
 grammarPoints: [],
 grammarExamples: [],
 grammarDetails: [],
});

const [conversion] = convertCourseBooks(courseExport);
const lesson = conversion?.book.lessons[0];
const sections = lesson?.sections ?? [];
const blocksOf = (title: string) =>
 sections.find((candidate) => candidate.title.startsWith(title))?.blocks ?? [];
const texts = (title: string) => blocksOf(title).map((block) => block.text);

describe("convertCourseBooks", () => {
 it("creates one book per database book with lessons and skips deleted lessons", () => {
  expect(convertCourseBooks(courseExport)).toHaveLength(1);
  expect(conversion?.book).toMatchObject({
   id: "hanyu-q2-shang",
   key: "hanyu-q2-shang",
   label: "Quyển 2 Thượng",
  });
  expect(conversion?.book.lessons).toHaveLength(1);
  expect(lesson).toMatchObject({
   id: "hanyu-q2-shang-lesson-01",
   number: 1,
   rawTitle: "BÀI 1 (第一课)",
   title: "BÀI 1: 田芳去哪儿了",
   intro: ["Điền Phương đi đâu rồi?"],
  });
 });

 it("orders vocabulary by item_order, keeps the source row identity and maps the row fields", () => {
  expect(lesson?.vocab).toEqual([
   {
    id: "hanyu-q2-shang-lesson-01-vocab-v1",
    hanzi: "在",
    traditional: "",
    pinyin: "zài",
    pos: "Động từ",
    hanviet: "tại",
    meaning: "ở",
   },
   {
    id: "hanyu-q2-shang-lesson-01-vocab-v2",
    hanzi: "出去",
    traditional: "",
    pinyin: "chūqu",
    pos: "动",
    hanviet: "xuất khứ",
    meaning: "ra ngoài",
   },
  ]);
 });

 it("orders sections text, vocab, grammar, practice with deterministic unique block ids", () => {
  expect(sections.map((candidate) => candidate.category)).toEqual([
   "text",
   "vocab",
   "grammar",
   "practice",
   "practice",
  ]);
  const ids = sections.flatMap((candidate) => candidate.blocks.map((block) => block.id));
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids[0]).toBe("hanyu-q2-shang-lesson-01-s1-b001");
 });

 it("writes narrative paragraphs and dialogue turns with speaker and translation, without pinyin", () => {
  expect(blocksOf("text")).toEqual([
   expect.objectContaining({ type: "subheading", text: "一封信", translation: "Một bức thư" }),
   expect.objectContaining({
    type: "paragraph",
    text: "昨天我给山本打电话。",
    translation: "Hôm qua tôi gọi điện cho Yamamoto.",
   }),
   expect.objectContaining({ type: "subheading", text: "田芳去哪儿了" }),
   expect.objectContaining({
    text: "田芳在吗？",
    speaker: "张东",
    translation: "Điền Phương có ở đây không?",
   }),
   expect.objectContaining({
    text: "她出去了。",
    speaker: "玛丽",
    translation: "Cô ấy ra ngoài rồi.",
   }),
  ]);
  expect(JSON.stringify(blocksOf("text"))).not.toContain("Zuótiān");
 });

 it("writes proper nouns as a Từ / Pinyin / Nghĩa table", () => {
  expect(blocksOf("proper_nouns")[0]?.rows).toEqual([
   ["Từ", "Pinyin", "Nghĩa"],
   ["上海", "Shànghǎi", "Thượng Hải"],
  ]);
 });

 it("writes a grammar point as subheading, formulas and a parseable example", () => {
  const [heading, meaning, pattern, formula, example] = blocksOf("grammar");
  expect(heading).toMatchObject({
   type: "subheading",
   text: "动作的完成：动词 + 了",
   translation: "Động tác hoàn thành",
  });
  expect(meaning?.text).toBe("Khẳng định: Ai đó đã làm xong một việc.");
  expect(pattern?.text).toBe("Cấu trúc: 主语 + 动词 + 了 + 宾语");
  expect(formula?.text).toBe("Công thức: S + 没 + V + O (Phủ định)");
  expect(splitBusinessChineseGrammarExample(example?.text ?? "")).toEqual({
   source: "(1) 我买了一本书。",
   translation: "Tôi đã mua một quyển sách.",
  });
 });

 it("writes a multiple-choice question the reader parses as choices with the correct key", () => {
  const block = texts("exercises").find((text) => text.includes("本来")) ?? "";
  const { prompt, answer } = splitBusinessChineseExercise(block);
  const parsed = parsePracticeExerciseItem(prompt, answer);
  expect(parsed.choices).toEqual([
   { key: "A", text: "本来" },
   { key: "B", text: "原来" },
  ]);
  expect(parsed.correctChoice).toBe("A");
  expect(parsed.hasBlank).toBe(true);
  expect(answer).toContain("本来 = vốn dĩ.");
 });

 it("keeps title, instruction and word bank, and pairs answer-key answers by question id", () => {
  const practice = texts("exercises");
  expect(blocksOf("exercises")[0]).toMatchObject({
   type: "subheading",
   text: "一、选择正确答案",
   translation: "Chọn đáp án đúng",
  });
  expect(blocksOf("exercises")[1]).toMatchObject({
   text: "选择正确答案。",
   translation: "Chọn đáp án đúng.",
  });
  expect(splitPipePhraseDrill("才 | 就 | 还")).toEqual(["才", "就", "还"]);
  expect(practice).toContain("才 | 就 | 还");
  expect(practice).toContain("(1) 他昨天晚上九点___回来。 → 才");
  expect(practice).toContain("(2) 我下了课___去医院。 → 就");
 });

 it("leaves a question without a source answer as a plain prompt", () => {
  expect(texts("exercises")).toContain("要是你来，就___。");
  expect(texts("exercises").filter((text) => text.includes("要是你来"))).toHaveLength(1);
 });

 it("moves the text's comprehension questions into practice with their answers", () => {
  expect(texts("课文理解")).toEqual(["“我”给谁打电话？ → 给山本打电话。"]);
 });

 it("counts questions, answers and reference-only items in the coverage", () => {
  const coverage = conversion?.coverage[0];
  expect(coverage).toMatchObject({
   vocabIn: 2,
   vocabOut: 2,
   textFallback: false,
   grammarExamples: 1,
   grammarExamplesInline: 1,
  });
  const byId = new Map(coverage?.exercises.map((exercise) => [exercise.itemId, exercise]));
  expect(byId.get("ex-choice")).toMatchObject({
   questions: 1,
   answered: 1,
   choiceAnswers: 1,
   unanswered: 0,
  });
  expect(byId.get("ex-bank")).toMatchObject({ questions: 2, answered: 2, unanswered: 0 });
  expect(byId.get("ex-open")).toMatchObject({ questions: 1, answered: 0, unanswered: 1 });
  expect(byId.get("ex-ref")).toMatchObject({ referenceOnly: true, contentBlocks: 0 });
 });

 it("realigns answers that a positional import attached to an instruction line", () => {
  const zipped = courseExportSchema.parse({
   ...courseExport,
   sections: [
    section("exercises", 1, {
     source_answer_paragraphs: [{ text: "x" }],
     items: [
      {
       id: "zip",
       type: "fill_blank",
       order: 1,
       title: "Bài tập 6",
       questions: [
        { id: "z1", prompt: "(回想/回忆, 相信/信任)", answer: "回忆" },
        { id: "z2", prompt: "那段生活给他留下了痛苦的 ( )。", answer: "相信" },
        { id: "z3", prompt: "我 ( ) 他说的话全是真的。", answer: "" },
       ],
      },
     ],
    }),
   ],
  });
  const [result] = convertCourseBooks(zipped);
  const written = result?.book.lessons[0]?.sections[0]?.blocks.map((block) => block.text);
  expect(written).toEqual([
   "Bài tập 6",
   "(回想/回忆, 相信/信任)",
   "(1) 那段生活给他留下了痛苦的 ___。 → 回忆",
   "(2) 我 ___ 他说的话全是真的。 → 相信",
  ]);
  expect(result?.coverage[0]?.exercises[0]).toMatchObject({ realigned: true, answered: 2 });
 });
});
