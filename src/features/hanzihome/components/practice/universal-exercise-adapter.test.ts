import { describe, expect, it } from "vitest";
import {
 adaptVocabDrillsToUniversal,
 adaptTextbookPracticeToUniversal,
 evaluateUniversalAnswer,
} from "./universal-exercise-adapter";
import type { ContextualVocabDrillItem } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

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
  expect(item?.title).toBe("面的");
  expect(item?.interaction.type).toBe("cloze");
  if (item && item.interaction.type === "cloze") {
   expect(item.interaction.expectedAnswer).toBe("面的");
   expect(item.interaction.preText).toContain("自行车谁也怕");
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
    { id: "p1", type: "paragraph", text: "Câu hỏi A. 1 B. 2", rows: [] },
    { id: "a1", type: "paragraph", text: "Đáp án: → A", rows: [] },
   ]);
   const item = items[0];
   if (item) {
    expect(evaluateUniversalAnswer(item, "A")).toBe(true);
    expect(evaluateUniversalAnswer(item, "a")).toBe(true);
    expect(evaluateUniversalAnswer(item, "B")).toBe(false);
   }
  });
 });
});
