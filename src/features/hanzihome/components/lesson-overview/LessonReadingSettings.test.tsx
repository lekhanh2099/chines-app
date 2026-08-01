import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LessonReadingSettings } from "./LessonReadingSettings";
import { getHanziFontFamily } from "./hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "./types";

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

 it("uses the Khải thư stack for the system reader font", () => {
  expect(getHanziFontFamily(DEFAULT_LESSON_DISPLAY_MODE.hanziFont)).toContain('"Kaiti SC"');
 });
});
