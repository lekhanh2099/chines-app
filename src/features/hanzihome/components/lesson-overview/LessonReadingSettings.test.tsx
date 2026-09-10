import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import readerStudyMessages from "../../../../../messages/vi/reader-study.json";
import type { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import type {
 DropdownMenuCheckboxItem,
 DropdownMenuItem,
 DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";

const { mockLearningState, learningStateMock, checkboxItemMock, radioGroupMock, menuItemMock } =
 vi.hoisted(() => ({
  learningStateMock: vi.fn<typeof useLearningState>(),
  checkboxItemMock: vi.fn<(props: ComponentProps<typeof DropdownMenuCheckboxItem>) => void>(),
  radioGroupMock: vi.fn<(props: ComponentProps<typeof DropdownMenuRadioGroup>) => void>(),
  menuItemMock: vi.fn<(props: ComponentProps<typeof DropdownMenuItem>) => void>(),
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
   durability: "durable",
   pendingSyncCount: 0,
   lastSyncError: null,
   retrySync: vi.fn<ReturnType<typeof useLearningState>["retrySync"]>(async () => ({
    status: "synced",
    syncedCount: 0,
    pendingCount: 0,
   })),
   updateSettings: vi.fn<ReturnType<typeof useLearningState>["updateSettings"]>(),
   updateVocabProgress: () => undefined,
   updateGrammarProgress: () => undefined,
   toggleBookmark: () => undefined,
   appendReviewHistory: () => undefined,
   recordReview: () => undefined,
  } satisfies ReturnType<typeof useLearningState>,
 }));

vi.mock("@/components/ui/dropdown-menu", () => {
 const passthrough = ({ children }: { children?: ReactNode }) => children;

 return {
  DropdownMenu: passthrough,
  DropdownMenuCheckboxItem: (props: ComponentProps<typeof DropdownMenuCheckboxItem>) => {
   checkboxItemMock(props);
   return props.children;
  },
  DropdownMenuContent: passthrough,
  DropdownMenuItem: (props: ComponentProps<typeof DropdownMenuItem>) => {
   menuItemMock(props);
   return props.children;
  },
  DropdownMenuLabel: passthrough,
  DropdownMenuRadioGroup: (props: ComponentProps<typeof DropdownMenuRadioGroup>) => {
   radioGroupMock(props);
   return props.children;
  },
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
  useLearningState: learningStateMock,
 };
});

import { HanziHomeReadingQuickSettingsMenu } from "../../HanziHomeReadingSettingsSection";
import { LessonReadingSettings } from "./LessonReadingSettings";
import { getHanziFontFamily, getHanziTypographyStyle } from "./hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "./types";

beforeEach(() => {
 vi.clearAllMocks();
 learningStateMock.mockReturnValue(mockLearningState);
});

function renderReadingSettings(element: ReactNode) {
 return renderToStaticMarkup(
  <NextIntlClientProvider
   locale="vi"
   messages={{ Reader: { study: readerStudyMessages } }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   {element}
  </NextIntlClientProvider>,
 );
}

describe("LessonReadingSettings", () => {
 it("offers the supported reader fonts and selects Khải thư by default", () => {
  const html = renderReadingSettings(
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
  const markup = renderReadingSettings(
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
  const markup = renderReadingSettings(
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

 it("routes controlled quick-menu changes to the supplied settings without loading learning state", () => {
  const displayMode = {
   ...DEFAULT_LESSON_DISPLAY_MODE,
   showPinyin: false,
   showMeaning: true,
   autoDetectPinyin: false,
  };
  const onChange = vi.fn<(updates: Partial<typeof displayMode>) => void>();
  renderReadingSettings(
   <HanziHomeReadingQuickSettingsMenu displayMode={displayMode} onChange={onChange} />,
  );

  expect(learningStateMock).not.toHaveBeenCalled();
  const fontGroup = radioGroupMock.mock.calls.find(
   ([props]) => props.value === displayMode.hanziFont,
  )?.[0];
  const sizeGroup = radioGroupMock.mock.calls.find(
   ([props]) => props.value === displayMode.hanziSize,
  )?.[0];
  const revealGroup = radioGroupMock.mock.calls.find(
   ([props]) => props.value === displayMode.revealMode,
  )?.[0];
  if (!fontGroup?.onValueChange || !sizeGroup?.onValueChange || !revealGroup?.onValueChange) {
   throw new Error("Expected the controlled font, size, and reveal groups.");
  }
  fontGroup.onValueChange("songti");
  sizeGroup.onValueChange("3xl");
  revealGroup.onValueChange("tap");
  expect(onChange).toHaveBeenNthCalledWith(1, { hanziFont: "songti" });
  expect(onChange).toHaveBeenNthCalledWith(2, { hanziSize: "3xl" });
  expect(onChange).toHaveBeenNthCalledWith(3, { revealMode: "tap" });

  const pinyin = checkboxItemMock.mock.calls.find(([props]) => props.children === "Pinyin")?.[0];
  const meaning = checkboxItemMock.mock.calls.find(([props]) => props.children === "Nghĩa")?.[0];
  const answers = checkboxItemMock.mock.calls.find(([props]) => props.children === "Đáp án")?.[0];
  const automaticPinyin = checkboxItemMock.mock.calls.find(
   ([props]) => props.children === "Tự nhận diện pinyin",
  )?.[0];
  if (
   !pinyin?.onCheckedChange ||
   !meaning?.onCheckedChange ||
   !answers?.onCheckedChange ||
   !automaticPinyin?.onCheckedChange
  ) {
   throw new Error("Expected all four controlled visibility choices.");
  }
  expect(pinyin.checked).toBe(false);
  expect(meaning.checked).toBe(true);
  expect(automaticPinyin.checked).toBe(false);
  pinyin.onCheckedChange(true);
  meaning.onCheckedChange(false);
  answers.onCheckedChange(true);
  automaticPinyin.onCheckedChange(true);
  expect(onChange).toHaveBeenNthCalledWith(4, { showPinyin: true });
  expect(onChange).toHaveBeenNthCalledWith(5, { showMeaning: false });
  expect(onChange).toHaveBeenNthCalledWith(6, { showAnswers: true });
  expect(onChange).toHaveBeenNthCalledWith(7, { autoDetectPinyin: true });
  expect(mockLearningState.updateSettings).not.toHaveBeenCalled();
 });

 it("keeps the no-props quick menu connected to persisted settings", () => {
  const displayMode = { ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: false };
  learningStateMock.mockReturnValue({
   ...mockLearningState,
   state: { ...mockLearningState.state, settings: { lessonTextDisplayMode: displayMode } },
  });
  renderReadingSettings(<HanziHomeReadingQuickSettingsMenu />);

  expect(learningStateMock).toHaveBeenCalledOnce();
  const pinyin = checkboxItemMock.mock.calls.find(([props]) => props.children === "Pinyin")?.[0];
  if (!pinyin?.onCheckedChange) throw new Error("Expected the persisted pinyin control.");
  pinyin.onCheckedChange(false);
  expect(mockLearningState.updateSettings).toHaveBeenCalledWith({
   lessonTextDisplayMode: { ...displayMode, showPinyin: false },
  });
 });

 it("preserves the connected loading and retry states", () => {
  learningStateMock.mockReturnValue({ ...mockLearningState, isLoading: true });
  const loadingMarkup = renderReadingSettings(<HanziHomeReadingQuickSettingsMenu />);
  expect(loadingMarkup).toContain("Đang tải cài đặt đọc…");
  expect(radioGroupMock).not.toHaveBeenCalled();

  learningStateMock.mockReturnValue({ ...mockLearningState, isError: true });
  const errorMarkup = renderReadingSettings(<HanziHomeReadingQuickSettingsMenu />);
  expect(errorMarkup).toContain("Thử đồng bộ lại");
  const retry = menuItemMock.mock.calls.find(([props]) => props.onSelect)?.[0];
  if (!retry?.onSelect) throw new Error("Expected the connected sync retry.");
  retry.onSelect(new Event("select"));
  expect(mockLearningState.retrySync).toHaveBeenCalledOnce();
 });

 it("keeps pinyin visibility and automatic detection independent", () => {
  const markup = renderReadingSettings(
   <LessonReadingSettings
    displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showPinyin: false }}
    onChange={vi.fn()}
   />,
  );
  const automaticPinyinControl = markup.match(
   /<button[^>]*aria-label="Tự nhận diện pinyin"[^>]*>/,
  )?.[0];

  expect(automaticPinyinControl).toBeDefined();
  expect(automaticPinyinControl).not.toContain(' disabled=""');
  expect(markup).toContain("Tự nhận diện pinyin");
  expect(markup).toContain("Ưu tiên pinyin có sẵn nếu căn được");
  expect(markup).not.toContain("Reader.study.chrome.tools.autoPinyin");
 });
});
