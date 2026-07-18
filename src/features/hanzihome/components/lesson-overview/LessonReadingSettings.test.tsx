import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LessonReadingSettings } from "./LessonReadingSettings";
import { DEFAULT_LESSON_DISPLAY_MODE } from "./types";

describe("LessonReadingSettings", () => {
 it("offers only the supported reader fonts and selects system by default", () => {
  const html = renderToStaticMarkup(
   <LessonReadingSettings displayMode={DEFAULT_LESSON_DISPLAY_MODE} onChange={vi.fn()} />,
  );

  expect(html).toContain("Hệ thống");
  expect(html).toContain("Songti");
  expect(html).toContain("Pinyin");
  expect(html).not.toContain('<span class="truncate">Kai</span>');
  expect(html).not.toContain('<span class="truncate">Mộng Thần</span>');
  expect(html).toMatch(
   /<button[^>]*aria-pressed="true"[^>]*>[\s\S]*?<span class="truncate">Hệ thống<\/span>/,
  );
 });
});
