import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

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
