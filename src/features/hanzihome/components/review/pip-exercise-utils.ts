import type { UniversalExerciseItem } from "@/features/hanzihome/components/practice/universal-exercise.types";

/** The correct answer shown after a wrong attempt, or undefined when the interaction has none. */
export function getTargetAnswer(item: UniversalExerciseItem): string | undefined {
 const interaction = item.interaction;
 if (interaction.type === "cloze") {
  return interaction.expectedAnswer;
 }
 if (interaction.type === "choice") {
  const opt = interaction.options.find((o) => o.key === interaction.correctKey);
  return opt ? `${opt.key}. ${opt.label}` : interaction.correctKey;
 }
 if (interaction.type === "reorder") {
  return interaction.correctOrder.join(" ");
 }
 if (interaction.type === "open") {
  return interaction.suggestedAnswer;
 }
 return undefined;
}
