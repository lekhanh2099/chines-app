import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import readerStudyMessages from "../../../../../messages/vi/reader-study.json";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import type { ReaderRuntimeState } from "../runtime/reader-runtime-store";

const { pointerState, runtimeState } = vi.hoisted(() => ({
 pointerState: { coarse: false },
 runtimeState: {
  segmentIds: ["segment-1"],
  activeIndex: 0,
  activeSegmentId: "segment-1",
  positionSource: "initial",
  loopCurrent: false,
  autoAdvance: true,
  focusMode: false,
  playbackSegmentId: null,
  playbackStatus: "idle",
  playbackStartOffset: 0,
  progress: 0,
  rate: 1,
  error: null,
 } satisfies ReaderRuntimeState,
}));

vi.mock("@/hooks/useCoarsePointer", () => ({
 useCoarsePointer: () => pointerState.coarse,
}));

vi.mock("@/features/hanzihome/hooks/useLearningState", () => ({
 useLearningState: () => {
  throw new Error("ReaderTools must use the supplied display mode in this test.");
 },
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

vi.mock("../runtime/ReaderRuntimeProvider", () => ({
 useReaderRuntimeCommands: () => ({ playAll: vi.fn() }),
 useReaderRuntimeActions: () => ({
  toggleLoop: vi.fn(),
  toggleAutoAdvance: vi.fn(),
  toggleFocus: vi.fn(),
 }),
 useReaderRuntimeSelector: <T,>(selector: (state: ReaderRuntimeState) => T) =>
  selector(runtimeState),
}));

import { ReaderTools } from "./ReaderTools";
import { ReaderCommandBar } from "./ReaderCommandBar";

afterEach(() => {
 pointerState.coarse = false;
});

function renderReaderTools() {
 return renderToStaticMarkup(
  <NextIntlClientProvider
   locale="vi"
   messages={{ Reader: { study: readerStudyMessages } }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   <ReaderTools displayMode={DEFAULT_LESSON_DISPLAY_MODE} onDisplayModeChange={() => undefined} />
  </NextIntlClientProvider>,
 );
}

describe("ReaderTools", () => {
 it("renders full desktop reading controls for supplied static settings without connected state", () => {
  const markup = renderReaderTools();

  expect(markup).toContain("Phông chữ");
  expect(markup).toContain("Cỡ chữ");
  expect(markup).toContain("Cách mở nội dung");
  expect(markup).toContain("Hiển thị lớp học");
  expect(markup).toContain("ZCOOL XiaoWei");
  expect(markup).toContain("Pinyin");
  expect(markup).toContain("Nghĩa");
  expect(markup).toContain("Đáp án");
  expect(markup).toContain("Tự nhận diện pinyin");
 });

 it("keeps the full accessible segment label and mobile controls in the shared toolbar", () => {
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider
    locale="vi"
    messages={{ Reader: { study: readerStudyMessages } }}
    timeZone="Asia/Ho_Chi_Minh"
   >
    <ReaderCommandBar
     segmentCount={14}
     onOpenOutline={vi.fn()}
     displayMode={DEFAULT_LESSON_DISPLAY_MODE}
     onDisplayModeChange={vi.fn()}
    />
   </NextIntlClientProvider>,
  );
  expect(markup).toContain("sr-only sm:not-sr-only");
  expect(markup).toContain("Đoạn 1 / 14");
  expect(markup).toContain('aria-label="Nghe bài"');
  expect(markup).toContain('aria-label="Công cụ học"');
  expect(markup).toContain("hidden sm:inline-flex");
 });
 it("uses the desktop dropdown for mouse and trackpad input regardless of viewport width", () => {
  pointerState.coarse = false;

  const markup = renderReaderTools();

  expect(markup).toContain("Công cụ học");
  expect(markup).not.toContain('aria-haspopup="dialog"');
  expect(markup).not.toContain("xl:hidden");
  expect(markup).not.toContain("hidden xl:block");
 });

 it("uses the touch sheet only for coarse pointer input", () => {
  pointerState.coarse = true;

  const markup = renderReaderTools();

  expect(markup).toContain("Công cụ học");
  expect(markup).toContain('aria-haspopup="dialog"');
  expect(markup).not.toContain("xl:hidden");
  expect(markup).not.toContain("hidden xl:block");
 });
});
