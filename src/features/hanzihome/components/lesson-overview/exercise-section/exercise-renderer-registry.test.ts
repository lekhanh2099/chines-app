import { describe, expect, it } from "vitest";

import { getExerciseRendererMeta } from "./exercise-renderer-registry";

const ACTIVE_EXERCISE_TYPES = [
 "answer_questions",
 "character_writing",
 "choose_words_fill_blank",
 "communication",
 "communication_dialogue",
 "complete_dialogue",
 "complete_sentence",
 "correct_sentence",
 "custom",
 "fill_blank",
 "generic",
 "matching",
 "multiple_choice",
 "open_ended",
 "phonetics",
 "read_aloud",
 "reading_cloze",
 "reading_comprehension",
 "reading_fill_blank",
 "reorder_sentence",
 "substitution_drill",
 "true_false",
 "writing",
];

describe("active exercise renderer registry", () => {
 it.each(ACTIVE_EXERCISE_TYPES)("maps %s to an explicit renderer family", (type) => {
  expect(getExerciseRendererMeta(type).family).not.toBe("generic");
 });

 it("keeps unknown future types on the diagnostic fallback", () => {
  expect(getExerciseRendererMeta("future_unmapped_type")).toEqual({
   family: "generic",
   label: "Bài tập",
  });
 });
});
