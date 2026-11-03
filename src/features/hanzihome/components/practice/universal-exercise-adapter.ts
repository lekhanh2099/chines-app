import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import {
 type ContextualVocabDrillItem,
 generateContextualVocabDrills,
 pairPracticeBlankAnswers,
 parsePracticeExerciseItem,
} from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import type { UniversalExerciseItem, UniversalInteraction } from "./universal-exercise.types";

const PUNCTUATION_CLEANUP = /[，。！？；：、“”‘’（）().,!?;:'"\s…—_＿-]/gu;

export function adaptVocabDrillsToUniversal(
 drills: readonly ContextualVocabDrillItem[],
): UniversalExerciseItem[] {
 return drills.map((drill) => {
  const blankMatch = drill.displayPrompt.match(/^([\s\S]*?)(?:[_＿]{3,}|…{2,}|\.\.\.+)([\s\S]*)$/u);
  const preText = blankMatch ? blankMatch[1]?.trim() : undefined;
  const postText = blankMatch ? blankMatch[2]?.trim() : undefined;

  return {
   id: drill.id,
   category: "vocab_cloze",
   title: drill.targetWord,
   prompt: drill.displayPrompt,
   promptTranslation: drill.sentenceTranslation,
   hint: `${drill.targetPinyin} · ${drill.targetMeaning}`,
   audioText: drill.fullSentence,
   interaction: {
    type: "cloze",
    expectedAnswer: drill.targetWord,
    placeholder: `Điền "${drill.targetWord}"`,
    preText,
    postText,
   },
  };
 });
}

export function adaptTextbookPracticeToUniversal(
 blocks: readonly TextbookLesson["sections"][number]["blocks"][number][],
): UniversalExerciseItem[] {
 const { pairedAnswers } = pairPracticeBlankAnswers(blocks);
 const items: UniversalExerciseItem[] = [];

 blocks.forEach((block) => {
  if (block.type !== "paragraph") return;
  const answer = pairedAnswers.get(block.id);
  if (!answer) return;

  const parsed = parsePracticeExerciseItem(block.text, answer);

  // Check choices from parsed or directly from block.text
  const choiceMatch = block.text.match(
   /^([\s\S]*?)\s+A[.．、]\s*([\s\S]+?)\s+B[.．、]\s*([\s\S]+?)\s+C[.．、]\s*([\s\S]+?)(?:\s+D[.．、]\s*([\s\S]+?))?$/u,
  );
  const directChoiceMatch = answer.match(/^(?:(?:Đáp án|正确答案)\s*[:：]?\s*)?([A-D])\b/iu);

  if ((parsed.choices.length > 0 && parsed.correctChoice) || (choiceMatch && directChoiceMatch)) {
   const options =
    parsed.choices.length > 0
     ? parsed.choices.map((c) => ({ key: c.key, label: c.text }))
     : ["A", "B", "C", "D"].flatMap((key, index) => {
        const text = choiceMatch ? choiceMatch[index + 2]?.trim() : undefined;
        return text ? [{ key, label: text }] : [];
       });

   const correctKey =
    parsed.correctChoice ||
    (directChoiceMatch ? (directChoiceMatch[1]?.toUpperCase() ?? "A") : "A");

   const promptText = choiceMatch
    ? (choiceMatch[1]?.trim() ?? parsed.displayPrompt)
    : parsed.displayPrompt;

   items.push({
    id: block.id,
    category: "practice_choice",
    title: parsed.keywordHint || "Chọn đáp án đúng",
    prompt: promptText,
    hint: parsed.keywordHint || undefined,
    audioText: promptText,
    interaction: {
     type: "choice",
     options,
     correctKey,
    },
   });
   return;
  }

  if (parsed.reorderTokens.length > 0) {
   items.push({
    id: block.id,
    category: "practice_reorder",
    title: "Sắp xếp câu",
    prompt: parsed.displayPrompt,
    audioText: parsed.answer,
    interaction: {
     type: "reorder",
     tokens: [...parsed.reorderTokens],
     correctOrder: parsed.answer.split(/\s+/u).filter(Boolean),
    },
   });
   return;
  }

  if (parsed.hasBlank) {
   const blankMatch = parsed.displayPrompt.match(
    /^([\s\S]*?)(?:[_＿]{3,}|…{2,}|\.\.\.+)([\s\S]*)$/u,
   );
   const preText = blankMatch ? blankMatch[1]?.trim() : undefined;
   const postText = blankMatch ? blankMatch[2]?.trim() : undefined;

   items.push({
    id: block.id,
    category: "practice_cloze",
    title: parsed.keywordHint || "Điền từ vào chỗ trống",
    prompt: parsed.displayPrompt,
    hint: parsed.keywordHint || undefined,
    audioText: parsed.answer,
    interaction: {
     type: "cloze",
     expectedAnswer: parsed.answer,
     placeholder: "Nhập từ phù hợp",
     preText,
     postText,
    },
   });
   return;
  }

  items.push({
   id: block.id,
   category: "practice_open",
   title: "Câu hỏi luyện tập",
   prompt: parsed.displayPrompt,
   audioText: parsed.displayPrompt,
   interaction: {
    type: "open",
    suggestedAnswer: parsed.answer,
   },
  });
 });

 return items;
}

export function adaptAllLessonExercises(lesson: TextbookLesson): UniversalExerciseItem[] {
 const vocabDrills = generateContextualVocabDrills(lesson);
 const universalVocabItems = adaptVocabDrillsToUniversal(vocabDrills);

 const practiceBlocks: TextbookLesson["sections"][number]["blocks"][number][] = [];
 lesson.sections.forEach((section: TextbookLesson["sections"][number]) => {
  if (section.category === "practice") {
   practiceBlocks.push(...section.blocks);
  }
 });

 const universalTextbookItems = adaptTextbookPracticeToUniversal(practiceBlocks);

 return [...universalVocabItems, ...universalTextbookItems];
}

type InteractionEvaluator<T extends UniversalInteraction["type"]> = (
 interaction: Extract<UniversalInteraction, { type: T }>,
 answer: string,
) => boolean;

const INTERACTION_EVALUATORS: {
 readonly [K in UniversalInteraction["type"]]: InteractionEvaluator<K>;
} = {
 cloze: (interaction, answer) => {
  const cleanInput = answer.trim().replace(PUNCTUATION_CLEANUP, "");
  const cleanTarget = interaction.expectedAnswer.trim().replace(PUNCTUATION_CLEANUP, "");
  return cleanInput.length > 0 && cleanInput === cleanTarget;
 },
 choice: (interaction, answer) => {
  return answer.trim().toUpperCase() === interaction.correctKey.trim().toUpperCase();
 },
 reorder: (interaction, answer) => {
  const cleanInput = answer.trim().replace(PUNCTUATION_CLEANUP, "");
  const cleanTarget = interaction.correctOrder.join("").trim().replace(PUNCTUATION_CLEANUP, "");
  return cleanInput.length > 0 && cleanInput === cleanTarget;
 },
 open: (_interaction, answer) => {
  return answer.trim().length > 0;
 },
};

export function evaluateUniversalAnswer(item: UniversalExerciseItem, userAnswer: string): boolean {
 const type = item.interaction.type;
 if (type === "cloze") {
  return INTERACTION_EVALUATORS.cloze(item.interaction, userAnswer);
 }
 if (type === "choice") {
  return INTERACTION_EVALUATORS.choice(item.interaction, userAnswer);
 }
 if (type === "reorder") {
  return INTERACTION_EVALUATORS.reorder(item.interaction, userAnswer);
 }
 if (type === "open") {
  return INTERACTION_EVALUATORS.open(item.interaction, userAnswer);
 }
 return false;
}
