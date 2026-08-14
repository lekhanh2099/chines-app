import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";

const { mockLearningState } = vi.hoisted(() => ({
 mockLearningState: {
  state: {
   settings: {},
   progress: { vocab: {}, grammar: {} },
   bookmarks: { lessons: [], vocab: [], grammar: [], radicals: [] },
   reviewHistory: [],
  },
  isLoading: false,
  isSaving: false,
  isError: false,
  isOnline: true,
  syncStatus: "synced",
  pendingSyncCount: 0,
  lastSyncError: null,
  retrySync: async () => ({ status: "synced", syncedCount: 0, pendingCount: 0 }),
  updateSettings: () => undefined,
  updateVocabProgress: () => undefined,
  updateGrammarProgress: () => undefined,
  recordLearningSession: () => undefined,
  addLearningReviewItem: () => undefined,
  rateLearningReviewItem: () => undefined,
  recordLearningEvent: () => undefined,
  toggleBookmark: () => undefined,
  appendReviewHistory: () => undefined,
 } satisfies ReturnType<typeof useLearningState>,
}));

vi.mock("@/components/ui/dropdown-menu", () => {
 const passthrough = ({ children }: { children?: ReactNode }) => children;

 return {
  DropdownMenu: passthrough,
  DropdownMenuCheckboxItem: passthrough,
  DropdownMenuContent: passthrough,
  DropdownMenuItem: passthrough,
  DropdownMenuLabel: passthrough,
  DropdownMenuRadioGroup: passthrough,
  DropdownMenuRadioItem: passthrough,
  DropdownMenuSeparator: () => null,
  DropdownMenuSub: passthrough,
  DropdownMenuSubContent: passthrough,
  DropdownMenuSubTrigger: passthrough,
  DropdownMenuTrigger: passthrough,
 };
});

vi.mock("@/features/hanzihome/hooks/useLearningState", () => {
 return {
  useLearningState: () => mockLearningState,
 };
});

import { HanziHomeReadingQuickSettingsMenu } from "../../HanziHomeReadingSettingsSection";
import { LessonReadingSettings } from "./LessonReadingSettings";
import { getHanziFontFamily, getHanziTypographyStyle } from "./hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "./types";

describe("LessonReadingSettings", () => {
 it("offers the supported reader fonts and selects Khải thư by default", () => {
  const html = renderToStaticMarkup(
   <LessonReadingSettings displayMode={DEFAULT_LESSON_DISPLAY_MODE} onChange={vi.fn()} />,
  );

  expect(html).not.toContain("Hệ thống");
  expect(html).toContain("Noto Serif SC");
  expect(html).not.toContain("Noto Sans SC");
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

 it("keeps Khải thư as the default with a deterministic shipped fallback before generic serif", () => {
  const kaitiFontFamily = getHanziFontFamily("kaiti");
  const systemFontFamily = getHanziFontFamily("system");

  expect(kaitiFontFamily).toContain('"HanziHome Kaiti"');
  expect(kaitiFontFamily).toContain('"Kaiti SC"');
  expect(kaitiFontFamily.indexOf('"HanziHome Kaiti"')).toBeLessThan(
   kaitiFontFamily.indexOf('"Kaiti SC"'),
  );
  expect(kaitiFontFamily.indexOf('"Kaiti SC"')).toBeLessThan(
   kaitiFontFamily.indexOf("var(--font-reading-noto-serif)"),
  );
  expect(kaitiFontFamily).not.toContain("var(--font-reading-ma-shan)");
  expect(kaitiFontFamily).not.toContain('"Ma Shan Zheng"');
  expect(kaitiFontFamily).not.toContain('"Popular Xingkai"');
  expect(kaitiFontFamily).toContain("var(--font-reading-noto-serif)");
  expect(kaitiFontFamily).not.toContain("font-lxgw-wenkai-mono-tc");
  expect(systemFontFamily).toContain("system-ui");
  expect(systemFontFamily).not.toBe(kaitiFontFamily);
  expect(getHanziTypographyStyle(DEFAULT_LESSON_DISPLAY_MODE).fontFamily).toBe(kaitiFontFamily);
 });

 it("renders the complete reader controls with a live preview", () => {
  const markup = renderToStaticMarkup(
   <LessonReadingSettings displayMode={DEFAULT_LESSON_DISPLAY_MODE} onChange={vi.fn()} />,
  );

  expect(markup).toContain("ZCOOL XiaoWei");
  expect(markup).toContain("Cực lớn");
  expect(markup).toContain("Bấm để mở");
  expect(markup).toContain("Đáp án");
  expect(markup).toContain("Xem trước");
  expect(markup).toContain("开始自己安排时间以后");
 });

 it("renders desktop quick reader categories as nested submenus", () => {
  const markup = renderToStaticMarkup(
   <DropdownMenu open>
    <DropdownMenuContent>
     <HanziHomeReadingQuickSettingsMenu />
    </DropdownMenuContent>
   </DropdownMenu>,
  );

  expect(markup).toContain("Phông chữ");
  expect(markup).toContain("Cỡ chữ");
  expect(markup).toContain("Cách mở nội dung");
  expect(markup).toContain("Hiển thị lớp học");
  expect(markup).toContain("ZCOOL XiaoWei");
 });
});
