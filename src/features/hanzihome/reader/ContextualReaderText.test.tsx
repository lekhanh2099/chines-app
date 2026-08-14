import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { analyzeContextualPronunciation } from "../pronunciation/contextual-pronunciation";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { ContextualReaderText } from "./ContextualReaderText";

describe("ContextualReaderText", () => {
 it("renders Hanzi and contextual spoken pinyin with the HanziHome typography primitive", () => {
  const markup = renderToStaticMarkup(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "一个", sourcePinyin: "yī gè" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
   />,
  );
  expect(markup).toContain("一");
  expect(markup).toContain("yí");
  expect(markup).toContain("gè");
 });
});
