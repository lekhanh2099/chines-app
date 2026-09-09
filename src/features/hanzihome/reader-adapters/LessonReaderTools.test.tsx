import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import readerDocumentMessages from "../../../../messages/vi/reader-document.json";
import readerStudyMessages from "../../../../messages/vi/reader-study.json";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { Reader } from "@/features/reader/components/Reader";

const pointerState = vi.hoisted(() => ({ coarse: false }));

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

import { LessonReaderTools } from "./LessonReaderTools";

afterEach(() => {
 pointerState.coarse = false;
});

function renderReaderTools() {
 return renderToStaticMarkup(
  <NextIntlClientProvider
   locale="vi"
   messages={{ Reader: { study: readerStudyMessages, document: readerDocumentMessages } }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   <Reader
    data={["你好。"]}
    services={{
     speech: { speak: async () => ({ completed: true, cancelled: false }), stop: vi.fn() },
     renderTools: () => (
      <LessonReaderTools displayMode={DEFAULT_LESSON_DISPLAY_MODE} onDisplayModeChange={vi.fn()} />
     ),
    }}
   />
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

 it("keeps one full toolbar immediately before the reader document", () => {
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider
    locale="vi"
    messages={{ Reader: { study: readerStudyMessages, document: readerDocumentMessages } }}
    timeZone="Asia/Ho_Chi_Minh"
   >
    <Reader
     data={Array.from({ length: 14 }, (_, index) => ({ id: String(index), zh: "你好。" }))}
     services={{
      speech: { speak: async () => ({ completed: true, cancelled: false }), stop: vi.fn() },
      renderTools: () => (
       <LessonReaderTools displayMode={DEFAULT_LESSON_DISPLAY_MODE} onDisplayModeChange={vi.fn()} />
      ),
     }}
    />
   </NextIntlClientProvider>,
  );
  expect(markup.indexOf("data-reader-toolbar")).toBeLessThan(markup.indexOf("data-reader-content"));
  expect(markup).toContain("Bài 1 / 1");
  expect(markup).toContain('aria-label="Nghe bài"');
  expect(markup).toContain('aria-label="Công cụ học"');
  expect(markup.match(/data-reader-toolbar/g)).toHaveLength(1);
  expect(markup).toContain('aria-label="Đoạn trước"');
  expect(markup).toContain('aria-label="Đoạn sau"');
  expect(markup).toContain('aria-label="Nghe lại đoạn"');
  expect(markup).toContain('aria-label="Dừng đọc"');
  expect(markup).toContain('aria-label="Tốc độ đọc"');
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
