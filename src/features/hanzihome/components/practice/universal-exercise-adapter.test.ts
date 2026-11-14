import { describe, expect, it } from "vitest";
import {
 adaptVocabDrillsToUniversal,
 adaptTextbookPracticeToUniversal,
 evaluateUniversalAnswer,
} from "./universal-exercise-adapter";
import type { ContextualVocabDrillItem } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import {
 type TextbookLesson,
 getBusinessChineseLesson,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

describe("universal-exercise-adapter", () => {
 it("adapts contextual vocab drills into cloze universal items", () => {
  const mockDrills: readonly ContextualVocabDrillItem[] = [
   {
    id: "drill-1",
    sentenceId: "sent-1",
    targetWord: "面的",
    targetPinyin: "miàndi",
    targetMeaning: "một loại xe taxi",
    targetHanviet: "diện đích",
    displayPrompt: "自行车谁也怕，有的骑车人真会钻空子，'____'得躲它。",
    fullSentence: "自行车谁也怕，有的骑车人真会钻空子，'面的'得躲它。",
    sentenceTranslation: "Xe đạp ai cũng sợ, xe diện phải né nó.",
   },
  ];

  const items = adaptVocabDrillsToUniversal(mockDrills);
  expect(items).toHaveLength(1);
  const item = items[0];
  expect(item?.category).toBe("vocab_cloze");
  expect(item?.title).toBe("Điền từ vào chỗ trống");
  expect(item?.interaction.type).toBe("cloze");
  if (item && item.interaction.type === "cloze") {
   expect(item.interaction.expectedAnswer).toBe("面的");
   expect(item.interaction.placeholder).toBe("Nhập từ phù hợp");
   expect(item.interaction.preText).toContain("自行车谁也怕");
  }
 });

 it("does not auto-grade a blank prompt without an answer key", () => {
  const items = adaptTextbookPracticeToUniversal([
   {
    id: "missing-answer",
    type: "paragraph",
    text: "李强是大华贸易公司的 ______ 联络员。",
    rows: [],
   },
  ]);

  expect(items).toEqual([]);
 });

 it("removes an instructional suffix before building a cloze sentence", () => {
  const items = adaptTextbookPracticeToUniversal([
   {
    id: "instruction-suffix",
    type: "paragraph",
    text: "经理，明天的会议 ______ (hoàn thành câu) → 经理，明天的会议是否照常进行？",
    rows: [],
   },
  ]);

  const item = items[0];
  expect(item?.interaction.type).toBe("cloze");
  if (item && item.interaction.type === "cloze") {
   expect(item.interaction.postText).not.toContain("hoàn thành câu");
   expect(evaluateUniversalAnswer(item, "是否照常进行")).toBe(true);
  }
 });

 it("adapts textbook practice blocks into choice and cloze items", () => {
  const blocks: TextbookLesson["sections"][number]["blocks"] = [
   {
    id: "block-prompt-1",
    type: "paragraph",
    text: "今天天气真好，我们____去公园玩吧。 A. 一起 B. 一共 C. 一样 D. 一直",
    rows: [],
   },
   {
    id: "block-ans-1",
    type: "paragraph",
    text: "Đáp án: → A",
    rows: [],
   },
   {
    id: "block-prompt-2",
    type: "paragraph",
    text: "请问这件衣服____钱？",
    rows: [],
   },
   {
    id: "block-ans-2",
    type: "paragraph",
    text: "Đáp án: → 多少",
    rows: [],
   },
  ];

  const items = adaptTextbookPracticeToUniversal(blocks);
  expect(items).toHaveLength(2);

  const choiceItem = items[0];
  expect(choiceItem?.category).toBe("practice_choice");
  expect(choiceItem?.interaction.type).toBe("choice");
  if (choiceItem && choiceItem.interaction.type === "choice") {
   expect(choiceItem.interaction.correctKey).toBe("A");
   expect(choiceItem.interaction.options).toHaveLength(4);
  }

  const clozeItem = items[1];
  expect(clozeItem?.category).toBe("practice_cloze");
  expect(clozeItem?.interaction.type).toBe("cloze");
  if (clozeItem && clozeItem.interaction.type === "cloze") {
   expect(clozeItem.interaction.expectedAnswer).toBe("多少");
  }
 });

 describe("evaluateUniversalAnswer", () => {
  it("evaluates cloze answer with punctuation tolerance", () => {
   const item = adaptVocabDrillsToUniversal([
    {
     id: "d1",
     sentenceId: "s1",
     targetWord: "面的",
     targetPinyin: "miàndi",
     targetMeaning: "taxi",
     targetHanviet: "diện đích",
     displayPrompt: "____",
     fullSentence: "面的",
     sentenceTranslation: "taxi",
    },
   ])[0];

   if (item) {
    expect(evaluateUniversalAnswer(item, "面的")).toBe(true);
    expect(evaluateUniversalAnswer(item, " 面的 ")).toBe(true);
    expect(evaluateUniversalAnswer(item, "sai")).toBe(false);
   }
  });

  it("evaluates choice answer case-insensitively", () => {
   const items = adaptTextbookPracticeToUniversal([
    {
     id: "p1",
     type: "paragraph",
     text: "1. Câu hỏi trắc nghiệm\nA. Lựa chọn 1\nB. Lựa chọn 2 → A",
     rows: [],
    },
   ]);
   const item = items[0];
   expect(item).toBeDefined();
   if (item) {
    expect(item.interaction.type).toBe("choice");
    expect(evaluateUniversalAnswer(item, "A")).toBe(true);
    expect(evaluateUniversalAnswer(item, "a")).toBe(true);
    expect(evaluateUniversalAnswer(item, "B")).toBe(false);
   }
  });

  it("extracts practice items from real textbook lessons", () => {
   const tm3 = getBusinessChineseLesson("tm3", 1);
   const tm3Blocks: TextbookLesson["sections"][number]["blocks"][number][] = [];
   if (tm3) {
    tm3.sections.forEach((s) => {
     if (s.category === "practice") tm3Blocks.push(...s.blocks);
    });
   }
   const tm3Items = adaptTextbookPracticeToUniversal(tm3Blocks);
   expect(tm3Items.length).toBeGreaterThan(50);

   const nc = getTextbookLesson("nhip-cau", 1);
   const ncBlocks: TextbookLesson["sections"][number]["blocks"][number][] = [];
   if (nc) {
    nc.sections.forEach((s) => {
     if (s.category === "practice") ncBlocks.push(...s.blocks);
    });
   }
   const ncItems = adaptTextbookPracticeToUniversal(ncBlocks);
   expect(ncItems.length).toBeGreaterThan(50);

   const dh = getTextbookLesson("doc-hieu", 1);
   const dhBlocks: TextbookLesson["sections"][number]["blocks"][number][] = [];
   if (dh) {
    dh.sections.forEach((s) => {
     if (s.category === "practice") dhBlocks.push(...s.blocks);
    });
   }
   const dhItems = adaptTextbookPracticeToUniversal(dhBlocks);
   expect(dhItems.length).toBeGreaterThan(50);

   const kn = getTextbookLesson("khau-ngu", 1);
   const knBlocks: TextbookLesson["sections"][number]["blocks"][number][] = [];
   if (kn) {
    kn.sections.forEach((s) => {
     if (s.category === "practice") knBlocks.push(...s.blocks);
    });
   }
   const knItems = adaptTextbookPracticeToUniversal(knBlocks);
   expect(knItems.length).toBeGreaterThan(20);
  });
 });
});
