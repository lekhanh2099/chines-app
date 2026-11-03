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
 const { pairedAnswers, consumedAnswerBlockIds } = pairPracticeBlankAnswers(blocks);
 const items: UniversalExerciseItem[] = [];
 let currentSubheading = "";

 blocks.forEach((block) => {
  if (block.type === "subheading") {
   currentSubheading = block.text.trim();
   return;
  }
  if (block.type !== "paragraph") return;
  if (consumedAnswerBlockIds.has(block.id)) return;

  const rawText = block.text.trim();
  if (!rawText) return;

  let promptText = "";
  let answerText = "";
  let promptTranslation: string | undefined;

  // Case A: Block has arrow "prompt → answer"
  const arrowMatch = rawText.match(/^([\s\S]+?)\s*→\s*([\s\S]+)$/u);
  if (arrowMatch) {
   promptText = arrowMatch[1]?.trim() ?? "";
   answerText = arrowMatch[2]?.trim() ?? "";
  } else if (pairedAnswers.has(block.id)) {
   // Case B: Block paired with answer from answers block below
   promptText = rawText;
   answerText = pairedAnswers.get(block.id) ?? "";
  } else {
   // Case C: Question without arrow or separate block (e.g. conversational/substitution/numbered drill)
   const isExerciseItem =
    /^[(（]?\d+[\.、)）]/u.test(rawText) ||
    /^[①②③④⑤⑥⑦⑧⑨⑩]/u.test(rawText) ||
    /[_＿]{3,}/u.test(rawText) ||
    /[?？]/u.test(rawText);

   if (!isExerciseItem) return;
   promptText = rawText;
   answerText = "";
  }

  // Skip answer-only blocks
  if (/^(?:Đáp án|👉\s*Đáp án|正确答案|参考答案)\s*[:：]?\s*$/iu.test(promptText)) {
   return;
  }

  // Extract trailing Vietnamese translation in parentheses if present
  const translationMatch = answerText.match(/\(([^()]+)\)$/u);
  if (translationMatch) {
   promptTranslation = translationMatch[1]?.trim();
   answerText = answerText.slice(0, translationMatch.index).trim();
  }

  // Parse prompt and clean answer
  const parsed = parsePracticeExerciseItem(promptText, answerText);

  // Check choices from parsed or directly from promptText
  const choiceMatch = promptText.match(
   /^([\s\S]*?)(?:\s*\n+\s*|\s+)(A)[.．、\s]\s*([\s\S]+?)(?:\s*\n+\s*|\s+)(B)[.．、\s]\s*([\s\S]+?)(?:(?:\s*\n+\s*|\s+)(C)[.．、\s]\s*([\s\S]+?))?(?:(?:\s*\n+\s*|\s+)(D)[.．、\s]\s*([\s\S]+?))?$/u,
  );
  const directChoiceMatch = answerText.match(
   /(?:👉\s*Đáp án\s*[:：]?\s*|Đáp án\s*[:：]?\s*|^)([A-D])\b/iu,
  );

  if ((parsed.choices.length > 0 && parsed.correctChoice) || (choiceMatch && directChoiceMatch)) {
   const optA = choiceMatch ? (choiceMatch[3]?.trim() ?? "") : "";
   const optB = choiceMatch ? (choiceMatch[5]?.trim() ?? "") : "";
   const optC = choiceMatch ? choiceMatch[7]?.trim() : undefined;
   const optD = choiceMatch ? choiceMatch[9]?.trim() : undefined;

   const options =
    parsed.choices.length > 0
     ? parsed.choices.map((c) => ({ key: c.key, label: c.text }))
     : [
        { key: "A", label: optA },
        { key: "B", label: optB },
        ...(optC ? [{ key: "C", label: optC }] : []),
        ...(optD ? [{ key: "D", label: optD }] : []),
       ];

   const correctKey =
    parsed.correctChoice ||
    (directChoiceMatch ? (directChoiceMatch[1]?.toUpperCase() ?? "A") : "A");

   const finalPrompt = choiceMatch
    ? (choiceMatch[1]?.trim() ?? parsed.displayPrompt)
    : parsed.displayPrompt;

   items.push({
    id: block.id,
    category: "practice_choice",
    title: currentSubheading || parsed.keywordHint || "Chọn đáp án đúng",
    prompt: finalPrompt,
    promptTranslation,
    hint: parsed.keywordHint || undefined,
    audioText: finalPrompt,
    interaction: {
     type: "choice",
     options,
     correctKey,
    },
   });
   return;
  }

  // Reorder interaction
  if (parsed.reorderTokens.length > 0) {
   items.push({
    id: block.id,
    category: "practice_reorder",
    title: currentSubheading || "Sắp xếp câu",
    prompt: parsed.displayPrompt,
    promptTranslation,
    audioText: parsed.answer || parsed.displayPrompt,
    interaction: {
     type: "reorder",
     tokens: [...parsed.reorderTokens],
     correctOrder: parsed.answer
      ? parsed.answer.split(/\s+/u).filter(Boolean)
      : [...parsed.reorderTokens],
    },
   });
   return;
  }

  // Cloze interaction
  if (parsed.hasBlank || /[_＿]{3,}/u.test(parsed.displayPrompt)) {
   const blankMatch = parsed.displayPrompt.match(
    /^([\s\S]*?)(?:[_＿]{3,}|…{2,}|\.\.\.+)([\s\S]*)$/u,
   );
   const preText = blankMatch ? blankMatch[1]?.trim() : undefined;
   const postText = blankMatch ? blankMatch[2]?.trim() : undefined;

   items.push({
    id: block.id,
    category: "practice_cloze",
    title: currentSubheading || parsed.keywordHint || "Điền từ vào chỗ trống",
    prompt: parsed.displayPrompt,
    promptTranslation,
    hint: parsed.keywordHint || undefined,
    audioText: parsed.answer || parsed.displayPrompt,
    interaction: {
     type: "cloze",
     expectedAnswer: parsed.answer || "",
     placeholder: "Nhập từ phù hợp",
     preText,
     postText,
    },
   });
   return;
  }

  // Open interaction (short answer, oral drill, translation)
  items.push({
   id: block.id,
   category: "practice_open",
   title: currentSubheading || "Câu hỏi luyện tập",
   prompt: parsed.displayPrompt,
   promptTranslation,
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
  if (cleanInput.length > 0 && cleanInput === cleanTarget) return true;
  // If target contains multiple candidates (e.g. answer / alternative)
  const candidates = interaction.expectedAnswer
   .split(/[/、\n]/u)
   .map((c) => c.trim().replace(PUNCTUATION_CLEANUP, ""))
   .filter(Boolean);
  return candidates.includes(cleanInput);
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
