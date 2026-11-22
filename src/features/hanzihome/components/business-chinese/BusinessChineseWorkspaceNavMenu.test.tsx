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
const mockTabs: ReadonlyArray<BusinessChineseNavTab<string>> = [
 { key: "vocab", label: "Từ vựng" },
 { key: "grammar", label: "Ngữ pháp" },
];

describe("BusinessChineseWorkspaceNavMenu", () => {
 it("keeps overflow navigation in a menu separate from lesson utilities", async () => {
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <BusinessChineseWorkspaceNavMenu
     tabs={mockTabs}
     activeView="text"
     onActiveViewChange={vi.fn()}
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
  expect(markup).not.toContain('aria-haspopup="dialog"');
  expect(markup).toContain('title="Các phần khác của bài học"');
  expect(markup).not.toContain(">Khác<");
 });

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
      />
      <BusinessChineseLessonActions
       isLessonBookmarked={isLessonBookmarked}
       onToggleLessonBookmark={vi.fn()}
       isLessonOfflineReady
      />
     </NextIntlClientProvider>,
    );
    expect(markup).toContain(messages.BusinessChinese.moreSectionsLabel);
    expect(markup).toContain(messages.BusinessChinese.lessonOptions);
    expect(markup).not.toContain(messages.BusinessChinese.voiceAndOffline.replaceAll("&", "&amp;"));
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
