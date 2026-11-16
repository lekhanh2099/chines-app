import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { appLocales } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import {
 BusinessChineseWorkspaceNavMenu,
 type BusinessChineseNavTab,
} from "./BusinessChineseWorkspaceNavMenu";
import { BusinessChineseLessonActions } from "./BusinessChineseWorkspaceToolbar";

vi.mock("@/components/ui/overlays/dropdown-menu", () => {
 const content = ({ children }: { children?: ReactNode }) => <>{children}</>;
 return {
  DropdownMenu: content,
  DropdownMenuTrigger: content,
  DropdownMenuContent: content,
  DropdownMenuLabel: content,
  DropdownMenuItem: content,
 };
});
vi.mock("@/components/ui/overlays/dialog", () => ({
 Dialog: ({ children }: { children?: ReactNode }) => <>{children}</>,
 DialogContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
 DialogHeader: ({ children }: { children?: ReactNode }) => <>{children}</>,
 DialogBody: ({ children }: { children?: ReactNode }) => <>{children}</>,
 DialogTitle: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
}));
vi.mock("@/features/speech/OfflineAudioSettingsDialog", () => ({
 OfflineAudioSettingsDialog: () => null,
}));

const mockTabs: ReadonlyArray<BusinessChineseNavTab<string>> = [
 { key: "vocab", label: "Từ vựng" },
 { key: "grammar", label: "Ngữ pháp" },
];

describe("BusinessChineseWorkspaceNavMenu", () => {
 it.each([false, true])(
  "keeps overflow navigation separate from lesson utilities (compact=%s)",
  async (compact) => {
   const messages = await loadAppMessages("vi");
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <BusinessChineseWorkspaceNavMenu
      tabs={mockTabs}
      activeView="text"
      onActiveViewChange={vi.fn()}
      compact={compact}
     />
    </NextIntlClientProvider>,
   );
   expect(markup).toContain('aria-label="Các phần khác của bài học"');
   expect(markup).toContain("Từ vựng");
   expect(markup).toContain("Ngữ pháp");
   expect(markup).not.toContain("Bài khóa");
   expect(markup).not.toContain("Đánh dấu");
   expect(markup).not.toContain("Offline");
   expect(markup).not.toContain("bg-warning");
   if (compact) expect(markup).toContain('aria-haspopup="dialog"');
   expect(markup).toContain('title="Các phần khác của bài học"');
   expect(markup).not.toContain(">Khác<");
  },
 );

 it("does not render an overflow entry when every module is already visible", async () => {
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <BusinessChineseWorkspaceNavMenu tabs={[]} activeView="text" onActiveViewChange={vi.fn()} />
   </NextIntlClientProvider>,
  );
  expect(markup).toBe("");
 });

 it.each(appLocales)(
  "renders navigation and lesson utilities through real %s messages",
  async (locale) => {
   const messages = await loadAppMessages(locale);
   for (const isLessonBookmarked of [false, true]) {
    const markup = renderToStaticMarkup(
     <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
      <BusinessChineseWorkspaceNavMenu
       tabs={mockTabs}
       activeView="text"
       onActiveViewChange={vi.fn()}
       compact
      />
      <BusinessChineseLessonActions
       audioSettingsOpen={false}
       onOpenAudioSettings={vi.fn()}
       triggerRef={null}
       onReturnFocus={vi.fn()}
       isLessonBookmarked={isLessonBookmarked}
       onToggleLessonBookmark={vi.fn()}
       isLessonOfflineReady
       compact
      />
     </NextIntlClientProvider>,
    );
    expect(markup).toContain(messages.BusinessChinese.moreSectionsLabel);
    expect(markup).toContain(messages.BusinessChinese.lessonOptions);
    expect(markup).toContain(messages.BusinessChinese.voiceAndOffline.replaceAll("&", "&amp;"));
    expect(markup).toContain(
     isLessonBookmarked
      ? messages.BusinessChinese.unbookmarkLesson
      : messages.BusinessChinese.bookmarkLesson,
    );
    expect(markup).not.toContain("BusinessChinese.");
   }
  },
 );
});
