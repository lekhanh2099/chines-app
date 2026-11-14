import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/components/ui/overlays/dropdown-menu", () => {
 const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
 return {
  DropdownMenu: passthrough,
  DropdownMenuTrigger: passthrough,
  DropdownMenuContent: passthrough,
  DropdownMenuItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuCheckboxItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
 };
});

import { GlobalHeaderStudyActions } from "./GlobalHeaderControls";
import { speechSettingsDialogStore } from "@/stores/speech/speech-dialog-store";

vi.mock("@/features/speech/OfflineAudioSettingsDialog", () => ({
 OfflineAudioSettingsDialog: () => <div data-testid="offline-dialog-mock" />,
}));

vi.mock("@/features/hanzihome/hooks/useLearningState", () => ({
 useLearningState: () => ({
  state: {
   settings: {
    lessonTextDisplayMode: {
     showPinyin: true,
     showMeaning: true,
    },
   },
  },
  updateSettings: vi.fn(),
 }),
}));

function renderWithProviders(element: React.ReactElement) {
 const queryClient = new QueryClient();
 return renderToStaticMarkup(
  <NextIntlClientProvider
   locale="vi"
   timeZone="Asia/Ho_Chi_Minh"
   messages={{
    Shell: {
     header: {
      showPinyin: "Hiện phiên âm Pinyin",
      hidePinyin: "Ẩn phiên âm Pinyin",
      showMeaning: "Hiện bản dịch tiếng Việt",
      hideMeaning: "Ẩn bản dịch tiếng Việt",
      meaning: "Bản dịch",
      displaySettings: "Hiển thị nội dung",
      readingDisplay: "Hiển thị nội dung",
      displayModeBoth: "Pinyin & Dịch",
      displayModePinyinOnly: "Pinyin",
      displayModeMeaningOnly: "Bản dịch",
      displayModeHanziOnly: "Chữ Hán",
      voiceSettings: "Cài đặt giọng đọc",
     },
    },
   }}
  >
   <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>
  </NextIntlClientProvider>,
 );
}

describe("GlobalHeaderControls", () => {
 it("renders unified display dropdown and voice button in GlobalHeaderStudyActions", () => {
  const html = renderWithProviders(createElement(GlobalHeaderStudyActions));
  expect(html).toContain("Pinyin &amp; Dịch");
  expect(html).toContain('aria-label="Hiển thị nội dung"');
  expect(html).toContain("Hiện phiên âm Pinyin");
  expect(html).toContain("Hiện bản dịch tiếng Việt");
  expect(html).toContain('aria-label="Cài đặt giọng đọc"');
 });

 it("allows opening and closing speech settings dialog via store", () => {
  expect(speechSettingsDialogStore.state.open).toBe(false);
  speechSettingsDialogStore.actions.openDialog();
  expect(speechSettingsDialogStore.state.open).toBe(true);
  speechSettingsDialogStore.actions.closeDialog();
  expect(speechSettingsDialogStore.state.open).toBe(false);
 });
});
