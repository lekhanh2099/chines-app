import type {
 DbGrammarExercise,
 GrammarExerciseContent,
 GrammarExerciseType,
 GrammarPointWithProgress,
} from "@/types/database";

export type ExerciseDraft = {
 id?: string;
 exercise_type: GrammarExerciseType;
 prompt: string;
 answerText: string;
 explanation: string;
};

export function buildExerciseContent(
 draft: ExerciseDraft,
): GrammarExerciseContent {
 if (draft.exercise_type === "multiple_choice") {
  const choices = draft.prompt
   .split("\n")
   .filter((line) => /^[A-D][\).]/.test(line.trim()))
   .map((line) => ({
    id: line.trim().slice(0, 1),
    text: line.trim().slice(2).trim(),
   }));
  return { choices };
 }
 if (draft.exercise_type === "reorder_sentence")
  return { tokens: draft.answerText.split(/\s+/).filter(Boolean) };
 if (draft.exercise_type === "fill_blank")
  return {
   accepted_answers: draft.answerText
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean),
  };
 return { sample_answer: draft.answerText };
}

export function buildExerciseAnswer(draft: ExerciseDraft) {
 if (draft.exercise_type === "multiple_choice")
  return { choice: draft.answerText.trim().slice(0, 1).toUpperCase() };
 return { text: draft.answerText.trim() };
}

export function evaluateExercise(
 exercise: DbGrammarExercise,
 answer: string,
 selectedChoice: string | null,
) {
 const content = (exercise.content || {}) as GrammarExerciseContent;
 if (exercise.exercise_type === "multiple_choice" || content.choices?.length) {
  return (
   selectedChoice?.toLowerCase() ===
   String(exercise.answer?.choice || exercise.answer?.id || "").toLowerCase()
  );
 }
 if (exercise.exercise_type === "translate_zh") {
  const normalized = normalize(answer);
  const required = content.required_terms || [];
  if (required.length)
   return required.every((term) => normalized.includes(normalize(term)));
  const sample = String(exercise.answer?.text || content.sample_answer || "");
  return sample ? normalize(sample) === normalized : Boolean(answer.trim());
 }
 if (exercise.exercise_type === "reorder_sentence") {
  const sample = String(exercise.answer?.text || content.sample_answer || "");
  return sample
   ? normalize(sample) === normalize(answer)
   : Boolean(answer.trim());
 }
 const accepted =
  content.accepted_answers ||
  [String(exercise.answer?.text || "")].filter(Boolean);
 if (!accepted.length) return true;
 const normalized = normalize(answer);
 return accepted.some((item) => normalize(item) === normalized);
}

export function getCoachQuiz(point: GrammarPointWithProgress) {
 const contentQuiz = point.content.quiz;
 if (contentQuiz?.q && contentQuiz.choices?.length) {
  const exercise = point.exercises.find(
   (item) => item.exercise_type === "multiple_choice",
  );
  return {
   prompt: contentQuiz.q,
   choices: contentQuiz.choices,
   answerIndex: Number.isFinite(contentQuiz.a) ? Number(contentQuiz.a) : 0,
   exerciseId: exercise?.id,
  };
 }
 const exercise = point.exercises.find(
  (item) => item.exercise_type === "multiple_choice",
 );
 const content = (exercise?.content || {}) as GrammarExerciseContent;
 const choices = content.choices?.map((choice) => choice.text) || [];
 const answerText =
  typeof exercise?.answer?.text === "string" ? exercise.answer.text : "";
 const answerIndex = Math.max(
  0,
  choices.findIndex((choice) => normalize(choice) === normalize(answerText)),
 );
 if (exercise && choices.length) {
  return {
   prompt: exercise.prompt,
   choices,
   answerIndex,
   exerciseId: exercise.id,
  };
 }
 return null;
}

export function getAnswerText(exercise: DbGrammarExercise) {
 const content = (exercise.content || {}) as GrammarExerciseContent;
 return String(
  exercise.answer?.text ||
   exercise.answer?.choice ||
   content.sample_answer ||
   content.accepted_answers?.join(", ") ||
   "",
 );
}

export function normalize(value: string) {
 return value
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "")
  .replace(/[，。！？、,.!?]/g, "");
}

export function lines(value: string) {
 return value
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
}
