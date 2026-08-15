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

 it("keeps paragraph-mode glyph actions keyboard reachable", () => {
  const markup = renderToStaticMarkup(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "一个", sourcePinyin: "yī gè" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    pinyinPresentation="paragraph"
    onGlyphClick={() => undefined}
   />,
  );
  expect(markup).toContain('role="button"');
  expect(markup).toContain('tabindex="0"');
  expect(markup).toContain('aria-label="Đọc từ chữ 一"');
  expect(markup).toContain('aria-label="Đọc từ chữ 个"');
 });

 it("preserves reviewed source phrase pinyin when alignment is valid", () => {
  const markup = renderToStaticMarkup(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "浙江", sourcePinyin: "Zhèjiāng" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    pinyinPresentation="paragraph"
    sourcePinyin="Zhèjiāng"
   />,
  );
  expect(markup).toContain("Zhèjiāng");
  expect(markup).not.toContain("zhè jiāng");
 });

 it("marks the active glyph while the reader is speaking", () => {
  const markup = renderToStaticMarkup(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "北京", sourcePinyin: "Běijīng" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    activeCharacterIndex={1}
   />,
  );
  expect(markup).toContain("reading-progress-highlight");
  expect(markup).toContain('aria-current="true"');
 });
});
