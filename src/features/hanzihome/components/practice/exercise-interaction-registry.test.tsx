import { describe, expect, it } from "vitest";
import { INTERACTION_REGISTRY } from "./exercise-interaction-registry";
import {
 UniversalExerciseItemSchema,
 type UniversalExerciseItem,
} from "./universal-exercise.types";

describe("INTERACTION_REGISTRY", () => {
 it("contains all supported interaction primitives without omissions", () => {
  expect(INTERACTION_REGISTRY.cloze).toBeDefined();
  expect(INTERACTION_REGISTRY.choice).toBeDefined();
  expect(INTERACTION_REGISTRY.reorder).toBeDefined();
  expect(INTERACTION_REGISTRY.open).toBeDefined();
 });

 it("validates cloze exercise schema correctly", () => {
  const item: UniversalExerciseItem = {
   id: "test-cloze",
   category: "vocab_cloze",
   prompt: "自行车谁也怕，'____'得躲它。",
   interaction: {
    type: "cloze",
    expectedAnswer: "面的",
    preText: "自行车谁也怕，'",
    postText: "'得躲它。",
   },
  };

  const parsed = UniversalExerciseItemSchema.safeParse(item);
  expect(parsed.success).toBe(true);
 });

 it("validates choice exercise schema correctly", () => {
  const item: UniversalExerciseItem = {
   id: "test-choice",
   category: "practice_choice",
   prompt: "今天的天气真好，我们____去公园吧。",
   interaction: {
    type: "choice",
    options: [
     { key: "A", label: "一起" },
     { key: "B", label: "一共" },
     { key: "C", label: "一样" },
     { key: "D", label: "一直" },
    ],
    correctKey: "A",
   },
  };

  const parsed = UniversalExerciseItemSchema.safeParse(item);
  expect(parsed.success).toBe(true);
 });

 it("validates reorder exercise schema correctly", () => {
  const item: UniversalExerciseItem = {
   id: "test-reorder",
   category: "practice_reorder",
   prompt: "Sắp xếp câu hoàn chỉnh",
   interaction: {
    type: "reorder",
    tokens: ["我们", "明天", "去", "北京"],
    correctOrder: ["我们", "明天", "去", "北京"],
   },
  };

  const parsed = UniversalExerciseItemSchema.safeParse(item);
  expect(parsed.success).toBe(true);
 });
});
