import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LessonReadingSettings } from "./LessonReadingSettings";
import { getHanziFontFamily, getHanziTypographyStyle } from "./hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "./types";

describe("LessonReadingSettings", () => {
 it("offers the supported reader fonts and selects Khải thư by default", () => {
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
  expect(html).toMatch(
   /<button[^>]*aria-pressed="true"[^>]*>[\s\S]*?<span[^>]*>Khải thư · 楷体<\/span>/,
  );
 });

 it("uses Khải thư for the default and system reader font", () => {
  const kaitiFontFamily = getHanziFontFamily("kaiti");

  expect(kaitiFontFamily).toContain('"Kaiti SC"');
  expect(kaitiFontFamily).toContain("var(--font-lxgw-wenkai-mono-tc)");
  expect(getHanziFontFamily("system")).toBe(kaitiFontFamily);
  expect(getHanziTypographyStyle(DEFAULT_LESSON_DISPLAY_MODE).fontFamily).toBe(kaitiFontFamily);
 });

 it("renders the complete reader-control grid reused by quick settings", () => {
  const markup = renderToStaticMarkup(
   <LessonReadingSettings displayMode={DEFAULT_LESSON_DISPLAY_MODE} onChange={vi.fn()} />,
  );

  expect(markup).toContain("ZCOOL XiaoWei");
  expect(markup).toContain("Cực lớn");
  expect(markup).toContain("Bấm để mở");
  expect(markup).toContain("Đáp án");
 });
});
