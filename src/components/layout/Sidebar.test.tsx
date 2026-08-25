import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";

import { Sidebar } from "./Sidebar";

vi.mock("next/navigation", () => ({
 useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
 usePathname: () => "/reader",
}));

const localeCases = [
 {
  locale: "vi",
  personalGroup: "Cá nhân",
  personalSection: "Không gian học",
  knowledgeGroup: "Năng lực",
  dataQuality: "Chất lượng dữ liệu",
  apiDocs: "API & tích hợp",
  tts: "Giọng đọc",
 },
 {
  locale: "en",
  personalGroup: "Personal",
  personalSection: "Study workspace",
  knowledgeGroup: "Capabilities",
  dataQuality: "Data quality",
  apiDocs: "API & integrations",
  tts: "Text to speech",
 },
 {
  locale: "zh-CN",
  personalGroup: "个人",
  personalSection: "学习空间",
  knowledgeGroup: "能力",
  dataQuality: "数据质量",
  apiDocs: "API 与集成",
  tts: "语音",
 },
] satisfies ReadonlyArray<{
 locale: AppLocale;
 personalGroup: string;
 personalSection: string;
 knowledgeGroup: string;
 dataQuality: string;
 apiDocs: string;
 tts: string;
}>;

describe("Sidebar translations", () => {
 it.each(localeCases)(
  "renders configured navigation labels for $locale instead of message keys",
  async ({ locale, personalGroup, personalSection, knowledgeGroup, dataQuality, apiDocs, tts }) => {
   const messages = await loadAppMessages(locale);
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <Sidebar canManageContent />
    </NextIntlClientProvider>,
   );

   expect(markup).toContain(personalGroup);
   expect(markup).toContain(personalSection);
   expect(markup).toContain(knowledgeGroup);
   expect(markup).not.toContain(dataQuality);
   expect(markup).not.toContain(apiDocs);
   expect(markup).not.toContain(tts);
   expect(markup).not.toContain("Shell.navigation.");
  },
 );
});
