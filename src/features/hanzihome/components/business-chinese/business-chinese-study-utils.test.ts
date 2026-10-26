import { describe, expect, it } from "vitest";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { getTextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import {
 businessChineseTableColumns,
 isCanonicalVocabularyTable,
 isChineseOnlyText,
 pairedTextbookTranslations,
 splitBusinessChineseExercise,
 splitBusinessChineseGrammarExample,
 businessChineseContentSections,
 businessChineseSourceSections,
 businessChineseTabAvailable,
 businessChineseVisibleBlocks,
 businessChineseVisibleSections,
 businessChineseVocabularyTableIds,
 businessChineseSectionDocuments,
 businessChineseReaderAnnotations,
 businessChineseReaderVocabulary,
 splitPipePhraseDrill,
 pairPracticeBlankAnswers,
 parsePracticeExerciseItem,
 evaluatePracticeAnswer,
} from "./business-chinese-study-utils";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";

const block: TextbookLesson["sections"][number]["blocks"][number] = {
 id: "table-1",
 type: "table",
 text: "",
 rows: [
  ["Từ", "Pinyin", "Nghĩa", "Đáp án"],
  ["你好", "nǐ hǎo", "Xin chào", "你好"],
 ],
 answerColumnIndexes: [3],
};
describe("Business Chinese study policies", () => {
 it("extracts all sixteen original phrase-drill items, including wrapped rows", () => {
  const lesson = getTextbookLesson("nhip-cau", 1);
  const drill = lesson?.sections
   .flatMap((section) => section.blocks)
   .find((item) => item.id === "nhip-cau-lesson-01-source-623");
  if (!drill) throw new Error("Expected the original phrase drill.");
  expect(splitPipePhraseDrill(drill.text)).toEqual([
   "重新认识",
   "反复考虑",
   "遥远的地方",
   "坚持下去",
   "重新决定",
   "反复修改",
   "地方很遥远",
   "继续下去",
   "相同的命运",
   "颤抖的双手",
   "对得起他",
   "控制不住",
   "命运的安排",
   "颤抖起来",
   "他对得起",
   "控制起来",
  ]);
  expect(splitPipePhraseDrill("你好 | 谢谢")).toEqual([]);
  expect(splitPipePhraseDrill("你好 | 谢谢 | 再见 → 答案")).toEqual([]);
  expect(splitPipePhraseDrill("你好 | | ")).toEqual([]);
 });

 it("pairs the eight source blanks without mutating or consuming unrelated blocks", () => {
  const section = getTextbookLesson("nhip-cau", 1)?.sections.find(
   (item) => item.category === "practice",
  );
  if (!section) throw new Error("Expected the original practice section.");
  const originalBlocks = section.blocks.map((item) => ({ id: item.id, text: item.text }));
  const { pairedAnswers, consumedAnswerBlockIds } = pairPracticeBlankAnswers(section.blocks);
  expect([...pairedAnswers]).toEqual([
   ["nhip-cau-lesson-01-source-627", "扭来扭去 / 扭一下"],
   ["nhip-cau-lesson-01-source-628", "摸一下 / 摸透了"],
   ["nhip-cau-lesson-01-source-629", "负担不起 / 负担很重"],
   ["nhip-cau-lesson-01-source-630", "拆下来 / 拆不开"],
   ["nhip-cau-lesson-01-source-631", "洒了一地 / 洒完"],
   ["nhip-cau-lesson-01-source-632", "富裕起来"],
   ["nhip-cau-lesson-01-source-633", "轻松一下 / 轻松得多"],
   ["nhip-cau-lesson-01-source-634", "拒绝了 / 拒绝不了"],
  ]);
  expect([...consumedAnswerBlockIds]).toEqual(["nhip-cau-lesson-01-source-636"]);
  expect(section.blocks.map((item) => ({ id: item.id, text: item.text }))).toEqual(originalBlocks);
  expect(section.blocks.find((item) => item.id.endsWith("source-627"))?.text).toBe(
   "扭 ___________",
  );
 });

 it.each(["subheading", "table", "arrow", "mismatched answers"])(
  "does not pair blanks across %s",
  (boundary) => {
   const prompt: TextbookLesson["sections"][number]["blocks"][number] = {
    id: "blank",
    type: "paragraph",
    text: "扭 ___",
    rows: [],
   };
   const answer: TextbookLesson["sections"][number]["blocks"][number] = {
    id: "answer",
    type: "paragraph",
    text: "Gợi ý đáp án: → 扭一下",
    rows: [],
   };
   const blocks: TextbookLesson["sections"][number]["blocks"] =
    boundary === "mismatched answers"
     ? [prompt, { ...answer, text: "参考答案：→ 扭一下\n摸一下" }]
     : [
        prompt,
        {
         id: "boundary",
         type:
          boundary === "table" ? "table" : boundary === "subheading" ? "subheading" : "paragraph",
         text: boundary === "arrow" ? "题目 → 答案" : "下一题",
         rows: [],
        },
        answer,
       ];
   expect(pairPracticeBlankAnswers(blocks).pairedAnswers.size).toBe(0);
   expect(pairPracticeBlankAnswers(blocks).consumedAnswerBlockIds.size).toBe(0);
  },
 );

 it.each([
  {
   prompt: "扭 ___________",
   answer: "扭来扭去 / 扭一下",
   hint: "",
   baseWord: "扭",
   hasBlank: true,
   exact: "一下",
   alternative: "扭来扭去",
  },
  {
   prompt: "_______________。 (富裕)",
   answer: "现在渐渐富裕起来了。",
   hint: "富裕",
   baseWord: "",
   hasBlank: true,
   exact: "现在渐渐富裕起来了！",
   alternative: "现在渐渐富裕起来了。",
  },
  {
   prompt: "你觉得这篇课文难吗？ (算)",
   answer: "这篇课文对我来说算难的。",
   hint: "算",
   baseWord: "",
   hasBlank: false,
   exact: "这篇课文对我来说算难的",
   alternative: "这篇课文对我来说算难的。",
  },
  {
   prompt: "任何被救助的孩子都很感激他们的救助人。",
   answer: "(凡……没有不……的) Đáp án: 凡是被救助的孩子，没有不感激他们的救助人的。",
   hint: "凡……没有不……的",
   baseWord: "",
   hasBlank: false,
   exact: "凡是被救助的孩子没有不感激他们的救助人的",
   alternative: "凡是被救助的孩子，没有不感激他们的救助人的。",
  },
 ])(
  "parses and evaluates the $hint exercise without changing its source prompt",
  ({ prompt, answer, hint, baseWord, hasBlank, exact, alternative }) => {
   const item = parsePracticeExerciseItem(prompt, answer);
   expect(item).toMatchObject({
    prompt,
    keywordHint: hint,
    baseWord,
    hasBlank,
    choices: [],
    correctChoice: "",
   });
   if (hint) expect(item.displayPrompt).not.toContain(`(${hint})`);
   expect(evaluatePracticeAnswer(exact, item).isExactMatch).toBe(true);
   expect(evaluatePracticeAnswer(alternative, item).isExactMatch).toBe(true);
   expect(evaluatePracticeAnswer("… ___", item)).toEqual({
    isAnswered: false,
    isExactMatch: false,
    isKeywordMatch: false,
   });
   expect(evaluatePracticeAnswer("错误的回答", item)).toEqual({
    isAnswered: true,
    isExactMatch: false,
    isKeywordMatch: false,
   });
  },
 );

 it("reports keyword use separately from an exact model-answer match", () => {
  const item = parsePracticeExerciseItem("用指定词语完成句子 (富裕)", "现在渐渐富裕起来了。");
  expect(evaluatePracticeAnswer("村民的生活越来越富裕。", item)).toEqual({
   isAnswered: true,
   isExactMatch: false,
   isKeywordMatch: true,
  });
  expect(evaluatePracticeAnswer("富裕", item).isKeywordMatch).toBe(false);
  const rewrite = parsePracticeExerciseItem(
   "改写句子",
   "(凡……没有不……的) Đáp án: 凡是被救助的孩子，没有不感激他们的救助人的。",
  );
  expect(evaluatePracticeAnswer("凡是努力学习的孩子，没有不进步的。", rewrite).isKeywordMatch).toBe(
   true,
  );
  expect(evaluatePracticeAnswer("凡是努力学习的孩子都会进步。", rewrite).isKeywordMatch).toBe(
   false,
  );
 });

 it.each([
  {
   lesson: getTextbookLesson("tm3", 10),
   id: "business-chinese-tm3-lesson-10-section-12-block-026",
   sentence: "下班时间刚到，他就收拾东西走了。",
   completion: "就收拾东西走了",
  },
  {
   lesson: getTextbookLesson("tm3", 1),
   id: "business-chinese-tm3-lesson-01-section-13-block-021",
   sentence: "只要办了银行卡，就可以不用到银行排队存取款了。",
   completion: "只要办了银行卡",
  },
  {
   lesson: getTextbookLesson("tm3", 2),
   id: "business-chinese-tm3-lesson-02-section-08-block-006",
   sentence: "今年房价非常高，一些地段的房价高达每平方米3万元。",
   completion: "高达每平方米3万元",
  },
 ])(
  "accepts Chinese answers without the source translation for $id",
  ({ lesson, id, sentence, completion }) => {
   const block = lesson?.sections
    .flatMap((section) => section.blocks)
    .find((item) => item.id === id);
   if (!block) throw new Error("Expected the source bilingual completion exercise.");
   const sourceText = block.text;
   const exercise = splitBusinessChineseExercise(block.text);
   const item = parsePracticeExerciseItem(exercise.prompt, exercise.answer);
   expect(evaluatePracticeAnswer(sentence, item).isExactMatch).toBe(true);
   expect(evaluatePracticeAnswer(completion, item).isExactMatch).toBe(true);
   expect(evaluatePracticeAnswer("错误的回答", item).isExactMatch).toBe(false);
   expect(evaluatePracticeAnswer("Vừa đến giờ tan làm", item).isExactMatch).toBe(false);
   expect(item.answer).toBe(exercise.answer);
   expect(block.text).toBe(sourceText);
  },
 );

 it("preserves Chinese parenthetical content and bilingual newline alternatives", () => {
  const item = parsePracticeExerciseItem("___", "你好。 (Xin/chào.)\n再见。 (Tạm biệt.)");
  expect(evaluatePracticeAnswer("你好", item).isExactMatch).toBe(true);
  expect(evaluatePracticeAnswer("再见", item).isExactMatch).toBe(true);
  expect(evaluatePracticeAnswer("Xin/chào", item).isExactMatch).toBe(false);
  const chineseParenthetical = parsePracticeExerciseItem("___", "我们去 (明天)");
  expect(evaluatePracticeAnswer("我们去", chineseParenthetical).isExactMatch).toBe(false);
  expect(evaluatePracticeAnswer("我们去（明天）", chineseParenthetical).isExactMatch).toBe(true);
 });

 it("accepts the source reading gap or completed sentence without filling multiple gaps alike", () => {
  const blocks = getTextbookLesson("doc-hieu", 2)?.sections.flatMap((section) => section.blocks);
  const singleBlank = blocks?.find(
   (item) => item.id === "doc-hieu-unit-02-article-01-practice-block-193",
  );
  const multipleBlanks = blocks?.find(
   (item) => item.id === "doc-hieu-unit-02-article-01-practice-block-194",
  );
  if (!singleBlank || !multipleBlanks)
   throw new Error("Expected the source reading blank exercises.");
  const singleExercise = splitBusinessChineseExercise(singleBlank.text);
  const singleItem = parsePracticeExerciseItem(singleExercise.prompt, singleExercise.answer);
  expect(evaluatePracticeAnswer("超市", singleItem).isExactMatch).toBe(true);
  expect(evaluatePracticeAnswer("她去超市给公婆买礼物。", singleItem).isExactMatch).toBe(true);
  expect(evaluatePracticeAnswer("商店", singleItem).isExactMatch).toBe(false);
  expect(evaluatePracticeAnswer("", singleItem).isAnswered).toBe(false);
  const multipleExercise = splitBusinessChineseExercise(multipleBlanks.text);
  const multipleItem = parsePracticeExerciseItem(multipleExercise.prompt, multipleExercise.answer);
  expect(evaluatePracticeAnswer(multipleExercise.answer, multipleItem).isExactMatch).toBe(true);
  expect(evaluatePracticeAnswer("一身", multipleItem).isExactMatch).toBe(false);
 });

 it.each([1, 2])(
  "parses source multiple-choice questions in lesson %i with three or four options",
  (number) => {
   const block = getTextbookLesson("nhip-cau", number)
    ?.sections.flatMap((section) => section.blocks)
    .find((item) => item.text.includes("A.") && item.text.includes("→ Đáp án:"));
   if (!block) throw new Error("Expected the original multiple-choice question.");
   const exercise = splitBusinessChineseExercise(block.text);
   const item = parsePracticeExerciseItem(exercise.prompt, exercise.answer);
   expect(item.choices.map((choice) => choice.key)).toEqual(
    number === 1 ? ["A", "B", "C", "D"] : ["A", "B", "C"],
   );
   expect(item.correctChoice).toBe(number === 1 ? "D" : "C");
   expect(item.displayPrompt).not.toContain("A.");
   expect(item.choices.every((choice) => choice.text.length > 0)).toBe(true);
   const multiline = parsePracticeExerciseItem(
    "问题 A. 第一行\n第二行 B. 二 C. 三 D. 四",
    "Đáp án: d",
   );
   expect(multiline.choices[0]?.text).toBe("第一行\n第二行");
   expect(multiline.correctChoice).toBe("D");
  },
 );

 it("evaluates the source reorder model and labelled alternative answers", () => {
  const prompt = "在 / 故意 / 他 / 借口 / 是 / 分明 / 找";
  const item = parsePracticeExerciseItem(prompt, "他分明是在故意找借口。");
  expect(item.reorderTokens).toEqual(["在", "故意", "他", "借口", "是", "分明", "找"]);
  expect(evaluatePracticeAnswer("他分明是在故意找借口", item).isExactMatch).toBe(true);
  expect(evaluatePracticeAnswer("在故意他借口是分明找", item).isExactMatch).toBe(false);
  expect(
   evaluatePracticeAnswer(
    "你好",
    parsePracticeExerciseItem("___", "参考答案：(1) 你好！\n(2) 您好。"),
   ).isExactMatch,
  ).toBe(true);
  expect(parsePracticeExerciseItem("一 / 二 / 三", "一二三").reorderTokens).toEqual([]);
 });

 it.each([
  {
   input: "(1) 他从来不浪费粮食. Anh ấy chưa bao giờ lãng phí lương thực.",
   source: "(1) 他从来不浪费粮食.",
   translation: "Anh ấy chưa bao giờ lãng phí lương thực.",
  },
  {
   input:
    '(4) "我给你叫去。"小护士说着就冲北房喊叫. "Tôi đi gọi cho anh." Nữ y tá nhỏ nói rồi hướng về phía nhà Bắc gọi to.',
   source: '(4) "我给你叫去。"小护士说着就冲北房喊叫.',
   translation: '"Tôi đi gọi cho anh." Nữ y tá nhỏ nói rồi hướng về phía nhà Bắc gọi to.',
  },
  {
   input:
    "(7) 儿子吵着闹着一定要买那件T恤衫. Con trai làm ầm ĩ mãi nhất định phải mua cái áo thun đó.",
   source: "(7) 儿子吵着闹着一定要买那件T恤衫.",
   translation: "Con trai làm ầm ĩ mãi nhất định phải mua cái áo thun đó.",
  },
  {
   input: "(4) 文章的大致内容是…… Nội dung đại khái của bài viết là...",
   source: "(4) 文章的大致内容是……",
   translation: "Nội dung đại khái của bài viết là...",
  },
  {
   input: "我回去试试。 → Tôi về thử xem.",
   source: "我回去试试。",
   translation: "Tôi về thử xem.",
  },
  {
   input: '1. Thường dùng trong câu phủ định với "没(有)".',
   source: '1. Thường dùng trong câu phủ định với "没(有)".',
   translation: "",
  },
  {
   input: 'S + 没(有) → Không dùng "不有".',
   source: 'S + 没(有) → Không dùng "不有".',
   translation: "",
  },
 ])(
  "separates bilingual examples while preserving Chinese text: $source",
  ({ input, source, translation }) => {
   expect(splitBusinessChineseGrammarExample(input)).toEqual({ source, translation });
  },
 );

 it("exposes all eight grammar points without losing source blocks or their identities", () => {
  const lesson = getTextbookLesson("nhip-cau", 3);
  const section = lesson?.sections.find((item) => item.category === "grammar");
  if (!lesson || !section) throw new Error("Expected Nhịp cầu lesson 3 grammar.");

  const groups = businessChineseVisibleSections(lesson.sections, "grammar");
  expect(groups).toHaveLength(8);
  expect(groups[0]?.id).toBe(section.id);
  expect(new Set(groups.map((group) => group.id)).size).toBe(8);
  expect(groups.every((group) => group.blocks[0]?.type === "subheading")).toBe(true);
  expect(groups.map((group) => group.title)).toEqual(
   section.blocks.filter((item) => item.type === "subheading").map((item) => item.text),
  );
  const blocks = groups.flatMap((group) => group.blocks);
  expect(blocks).toHaveLength(75);
  blocks.forEach((item, index) => expect(item).toBe(section.blocks[index]));
  expect(section.blocks).toHaveLength(75);

  const textSections = lesson.sections.filter((item) => item.category === "text");
  businessChineseVisibleSections(lesson.sections, "text").forEach((item, index) =>
   expect(item).toBe(textSections[index]),
  );
 });

 it("preserves source sections, empty navigation rules and canonical vocabulary visibility", () => {
  const sections: TextbookLesson["sections"] = [
   { id: "source", title: "BÀI KHÓA", category: "text", blocks: [block] },
   { id: "translation", title: "DỊCH BÀI KHÓA", category: "text", blocks: [block] },
   { id: "empty", title: "Empty", category: "grammar", blocks: [] },
  ];
  const content = businessChineseContentSections(sections);
  expect(businessChineseSourceSections(sections).map((section) => section.id)).toEqual([
   "source",
   "empty",
  ]);
  expect(content.map((section) => section.id)).toEqual(["source"]);
  expect(businessChineseVisibleSections(content, "grammar")).toEqual([]);
  expect(businessChineseVisibleSections(content, "all")).toEqual(content);
  expect(businessChineseTabAvailable("notes", [], 0, 0)).toBe(true);
  expect(businessChineseTabAvailable("dictation", content, 0, 0)).toBe(false);
  expect(businessChineseTabAvailable("dictation", content, 1, 0)).toBe(true);
  expect(businessChineseTabAvailable("text", content, 0, 0)).toBe(true);
  expect(businessChineseTabAvailable("vocab", content, 0, 1)).toBe(true);
  const vocab: TextbookLesson["vocab"] = [
   {
    id: "word",
    hanzi: "你好",
    traditional: "你好",
    pinyin: "nǐ hǎo",
    pos: "",
    hanviet: "",
    meaning: "Chào",
   },
  ];
  const ids = businessChineseVocabularyTableIds(content, vocab);
  expect(ids).toEqual(["table-1"]);
  const first = content[0];
  if (!first) throw new Error("Missing content section");
  expect(businessChineseVisibleBlocks(first, ids)).toEqual([]);
  expect(businessChineseReaderVocabulary(vocab)).toEqual([
   { id: "word", word: "你好", pinyin: "nǐ hǎo", meaning: "Chào" },
  ]);
  expect(sections[0]?.blocks).toEqual([block]);
 });
 it("creates section Reader documents with only their segments and the first heading", () => {
  const document: ReaderDocumentModel = {
   id: "lesson:text",
   language: "zh-CN",
   source: { kind: "lesson" },
   title: "你好",
   titleVi: "Chào",
   metadata: [],
   capabilities: [],
   sections: [
    { id: "one", title: "One", segmentIds: ["a"] },
    { id: "two", title: "Two", segmentIds: ["b"] },
   ],
   segments: [
    { id: "a", kind: "paragraph", sectionId: "one", zh: "你好" },
    { id: "b", kind: "paragraph", sectionId: "two", zh: "谢谢" },
   ],
  };
  const sections = businessChineseSectionDocuments(document);
  expect(sections.get("one")).toMatchObject({
   id: "lesson:text:one",
   title: "你好",
   titleVi: "Chào",
   sections: [document.sections[0]],
   segments: [document.segments[0]],
  });
  expect(sections.get("two")).toMatchObject({
   id: "lesson:text:two",
   title: undefined,
   titleVi: undefined,
   segments: [document.segments[1]],
  });
  expect(document.segments).toHaveLength(2);
 });
 it("renders only complete nonempty paragraph annotation ranges", () => {
  const annotation: ReaderAnnotationRow = {
   id: "00000000-0000-4000-8000-000000000001",
   user_id: "00000000-0000-4000-8000-000000000002",
   document_id: "lesson:text",
   paragraph_id: "paragraph",
   asset_id: null,
   annotation_type: "highlight",
   page_number: null,
   start_offset: 0,
   end_offset: 2,
   selected_text: "你好",
   note_text: "Ghi chú dòng 1\nGhi chú dòng 2",
   color: "yellow",
   payload: {},
   revision: 0,
   created_at: "2026-10-04T00:00:00Z",
   updated_at: "2026-10-04T00:00:00Z",
   deleted_at: null,
  };
  expect(
   businessChineseReaderAnnotations([
    annotation,
    { ...annotation, paragraph_id: null },
    { ...annotation, start_offset: null },
    { ...annotation, end_offset: 0 },
    { ...annotation, selected_text: "" },
   ]),
  ).toEqual([
   {
    id: annotation.id,
    segmentId: "paragraph",
    text: "你好",
    noteText: "Ghi chú dòng 1\nGhi chú dòng 2",
    start: 0,
    end: 2,
    color: "yellow",
   },
  ]);
 });
 it("applies answer and meaning visibility independently without mutating source rows", () => {
  const hidden = businessChineseTableColumns(
   block,
   { ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: false },
   false,
  );
  expect(hidden.visibleColumnIndexes).toEqual([0, 1]);
  expect(hidden.isVocabularyTable).toBe(true);
  expect(
   businessChineseTableColumns(block, { ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: true }, false)
    .visibleColumnIndexes,
  ).toEqual([0, 1, 2]);
  expect(
   businessChineseTableColumns(block, { ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: false }, true)
    .visibleColumnIndexes,
  ).toEqual([0, 1, 3]);
  expect(block.rows[0]).toHaveLength(4);
 });
 it("identifies canonical vocab by exact ordered Hanzi and pinyin, preserving alternate tables", () => {
  const vocabulary: TextbookLesson["vocab"] = [
   {
    id: "vocab-1",
    hanzi: "你好",
    traditional: "你好",
    pinyin: "nǐ hǎo",
    pos: "",
    hanviet: "",
    meaning: "Xin chào",
   },
  ];
  expect(isCanonicalVocabularyTable(block, vocabulary)).toBe(true);
  expect(
   isCanonicalVocabularyTable(
    { ...block, rows: [block.rows[0] ?? [], ["你好", "ní hǎo", "Xin chào", "你好"]] },
    vocabulary,
   ),
  ).toBe(false);
  expect(isCanonicalVocabularyTable(block, [])).toBe(false);
 });
 it("pairs translations by source block identity and handles absent translation sections", () => {
  const sections: TextbookLesson["sections"] = [
   {
    id: "source",
    title: "BÀI KHÓA",
    category: "text",
    blocks: [{ id: "source-block", type: "paragraph", text: "你好", rows: [] }],
   },
   {
    id: "translation",
    title: "DỊCH BÀI KHÓA",
    category: "text",
    blocks: [{ id: "translated-block", type: "paragraph", text: "Xin chào", rows: [] }],
   },
  ];
  expect([...pairedTextbookTranslations(sections)]).toEqual([["source-block", "Xin chào"]]);
  expect(pairedTextbookTranslations(sections.slice(0, 1)).size).toBe(0);
 });
 it("preserves Hanzi-only display and separates the first exercise arrow", () => {
  expect(isChineseOnlyText("你好，2026！")).toBe(true);
  expect(isChineseOnlyText("你好 — Xin chào")).toBe(false);
  expect(splitBusinessChineseExercise(" 请翻译 → Xin chào → ví dụ ")).toEqual({
   prompt: "请翻译",
   answer: "Xin chào → ví dụ",
  });
 });
});
