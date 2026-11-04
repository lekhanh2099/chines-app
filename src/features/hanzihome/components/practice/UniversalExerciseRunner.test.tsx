import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UniversalExerciseRunner } from "./UniversalExerciseRunner";
import type { UniversalExerciseItem } from "./universal-exercise.types";

vi.mock("@/features/hanzihome/hooks/useFastMandarinSpeech", () => ({
 useFastMandarinSpeech: () => ({
  speak: vi.fn(),
  stop: vi.fn(),
 }),
}));

describe("UniversalExerciseRunner", () => {
 it("renders empty state when no items provided", () => {
  const html = renderToStaticMarkup(
   createElement(UniversalExerciseRunner, {
    items: [],
   }),
  );

  expect(html).toContain("Không có câu hỏi luyện tập nào");
 });

 it("renders first question in focus mode with progress indicator", () => {
  const items: readonly UniversalExerciseItem[] = [
   {
    id: "q1",
    category: "vocab_cloze",
    title: "面的",
    prompt: "自行车谁也怕，'____'得躲它。",
    interaction: {
     type: "cloze",
     expectedAnswer: "面的",
     preText: "自行车谁也怕，'",
     postText: "'得躲它。",
    },
   },
   {
    id: "q2",
    category: "practice_choice",
    title: "Trắc nghiệm",
    prompt: "今天天气真好，我们____去吧。",
    interaction: {
     type: "choice",
     options: [
      { key: "A", label: "一起" },
      { key: "B", label: "一共" },
     ],
     correctKey: "A",
    },
   },
  ];

  const html = renderToStaticMarkup(
   createElement(UniversalExerciseRunner, {
    items,
   }),
  );

  expect(html).toContain("Câu 1 / 2");
  expect(html).toContain("自行车谁也怕");
  expect(html).toContain("Kiểm tra");
 });
});
