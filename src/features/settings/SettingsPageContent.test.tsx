import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
 useRouter: () => ({ push: vi.fn() }),
}));

import { resolveSettingsSection, SettingsPageContent } from "./SettingsPageContent";

const managementLocaleCases = [
 {
  locale: "vi",
  tab: "Quản trị",
  title: "Dữ liệu và tích hợp",
  dataQuality: "Chất lượng dữ liệu",
  api: "API & tích hợp",
 },
 {
  locale: "en",
  tab: "Administration",
  title: "Data and integrations",
  dataQuality: "Data quality",
  api: "API & integrations",
 },
 {
  locale: "zh-CN",
  tab: "管理",
  title: "数据与集成",
  dataQuality: "数据质量",
  api: "API 与集成",
 },
] satisfies ReadonlyArray<{
 locale: AppLocale;
 tab: string;
 title: string;
 dataQuality: string;
 api: string;
}>;

const voiceStudioLocaleCases = [
 {
  locale: "vi",
  label: "Giọng đọc",
  description: "Soạn nội dung, nghe thử, quản lý audio đã lưu và xuất MP3 trong workspace riêng.",
 },
 {
  locale: "en",
  label: "Text to speech",
  description:
   "Compose text, preview speech, manage saved audio, and export MP3 in a dedicated workspace.",
 },
 {
  locale: "zh-CN",
  label: "语音",
  description: "在独立工作区中编辑文本、试听语音、管理已保存的音频并导出 MP3。",
 },
] satisfies ReadonlyArray<{
 locale: AppLocale;
 label: string;
 description: string;
}>;

describe("resolveSettingsSection", () => {
 it("keeps supported Settings hub sections addressable", () => {
  expect(resolveSettingsSection("app", false)).toBe("app");
  expect(resolveSettingsSection("reading", false)).toBe("reading");
  expect(resolveSettingsSection("ai", false)).toBe("ai");
  expect(resolveSettingsSection("management", true)).toBe("management");
 });

 it("uses the app section for missing or invalid URL values", () => {
  expect(resolveSettingsSection(undefined, false)).toBe("app");
  expect(resolveSettingsSection("account", false)).toBe("app");
 });

 it("does not expose the management section without content capability", () => {
  expect(resolveSettingsSection("management", false)).toBe("app");
 });

 it.each(managementLocaleCases)(
  "renders the localized management destinations for $locale",
  async ({ locale, tab, title, dataQuality, api }) => {
   const messages = await loadAppMessages(locale);
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <SettingsPageContent
      sectionValue="management"
      canManageContent
      readingSettings={null}
      dailyReadingSettings={null}
     />
    </NextIntlClientProvider>,
   );

   expect(markup).toContain(tab);
   expect(markup).toContain(title);
   expect(markup).toContain(dataQuality);
   expect(markup).toContain(api.replaceAll("&", "&amp;"));
   expect(markup).toContain('href="/data-quality"');
   expect(markup).toContain('href="/api-docs"');
   expect(markup).not.toContain("Settings.management.");
   expect(markup).not.toContain("Shell.navigation.items.");
  },
 );

 it.each(voiceStudioLocaleCases)(
  "renders the localized voice studio destination in Reading settings for $locale",
  async ({ locale, label, description }) => {
   const messages = await loadAppMessages(locale);
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <SettingsPageContent
      sectionValue="reading"
      canManageContent={false}
      readingSettings={null}
      dailyReadingSettings={null}
     />
    </NextIntlClientProvider>,
   );

   expect(markup).toContain(label);
   expect(markup).toContain(description);
   expect(markup).toContain('href="/tts"');
   expect(markup).not.toContain("Settings.voiceStudio.");
   expect(markup).not.toContain("Shell.navigation.items.");
  },
 );
});
