import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LessonReadingSettings } from "./LessonReadingSettings";
import { getHanziFontFamily, getHanziTypographyStyle } from "./hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE, type LessonDisplayMode } from "./types";

describe("LessonReadingSettings", () => {
 it("offers the supported reader fonts and selects system by default", () => {
  const html = renderToStaticMarkup(
   <LessonReadingSettings displayMode={DEFAULT_LESSON_DISPLAY_MODE} onChange={vi.fn()} />,
  );

  expect(html).toContain("Hệ thống");
  expect(html).toContain("Noto Serif SC");
  expect(html).toContain("Noto Sans SC");
  expect(html).toContain("Pinyin");
  expect(html).toContain("Khải thư · 楷体");
  expect(html).toContain("Phỏng Tống · 仿宋");
  expect(html).toContain("Ma Shan Zheng");
  expect(html).toContain("ZCOOL XiaoWei");
  expect(html).not.toContain(">Kai</span>");
  expect(html).not.toContain(">Mộng Thần</span>");
  expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>[\s\S]*?<span[^>]*>Hệ thống<\/span>/);
 });

 it("uses Khải thư before the self-hosted fallback when the reader font changes", () => {
  const kaitiDisplayMode: LessonDisplayMode = {
   ...DEFAULT_LESSON_DISPLAY_MODE,
   hanziFont: "kaiti",
  };

  expect(getHanziFontFamily("kaiti")).toContain('"Kaiti SC"');
  expect(getHanziFontFamily("kaiti")).toContain("var(--font-lxgw-wenkai-mono-tc)");
  expect(getHanziTypographyStyle(kaitiDisplayMode).fontFamily).not.toBe(
   getHanziTypographyStyle(DEFAULT_LESSON_DISPLAY_MODE).fontFamily,
  );
 });
});
