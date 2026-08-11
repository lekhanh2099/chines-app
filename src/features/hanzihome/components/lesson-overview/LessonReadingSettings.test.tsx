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
  DropdownMenuShortcut: passthrough,
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

 it("renders the reader controls as a drill-in menu with a return action", () => {
  const markup = renderToStaticMarkup(
   <DropdownMenu open>
    <DropdownMenuContent>
     <HanziHomeReadingQuickSettingsMenu activeSection="font" onActiveSectionChange={vi.fn()} />
    </DropdownMenuContent>
   </DropdownMenu>,
  );

  expect(markup).toContain("Quay lại cài đặt nhanh");
  expect(markup).toContain("Phông chữ");
  expect(markup).toContain("ZCOOL XiaoWei");
 });
});
