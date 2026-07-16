import { describe, expect, it } from "vitest";

import { getExerciseRendererMeta } from "./exercise-renderer-registry";

const BOYA_EXERCISE_TYPES = [
 "answer_questions",
 "character_writing",
 "classification",
 "complete_dialogue",
 "fill_blank",
 "generic",
 "grammar_practice",
 "grammar_practice_set",
 "matching",
 "multiple_choice",
 "open_ended",
 "phonetics",
 "reorder_sentence",
 "sentence_transformation",
 "translation",
 "true_false",
] as const;

describe("Boya exercise renderer registry", () => {
 it.each(BOYA_EXERCISE_TYPES)("maps %s to an explicit renderer family", (type) => {
  expect(getExerciseRendererMeta(type).family).not.toBe("generic");
 });

 it("keeps unknown future types on the diagnostic fallback", () => {
  expect(getExerciseRendererMeta("future_unmapped_type")).toEqual({
   family: "generic",
   label: "Bài tập",
  });
 });
});
