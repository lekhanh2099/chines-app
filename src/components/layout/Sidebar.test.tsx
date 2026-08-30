import type { AriaAttributes, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";

import { filterNavigationGroupsForContentCapability, navigationItems } from "./navigation-config";
import { Sidebar } from "./Sidebar";

vi.mock("next/navigation", () => ({
 useSearchParams: () => new URLSearchParams(),
}));

let currentPathname = "/reader";

vi.mock("@/i18n/navigation", () => ({
 Link: ({
  children,
  href,
  ...props
 }: {
  children: ReactNode;
  href: string;
  "aria-current"?: AriaAttributes["aria-current"];
 }) => (
  <a href={href} aria-current={props["aria-current"]}>
   {children}
  </a>
 ),
 usePathname: () => currentPathname,
}));

const localeCases = [
 {
  locale: "vi",
  personalGroup: "Cá nhân",
  knowledgeGroup: "Năng lực",
  moreCluster: "Thêm",
  dataQuality: "Chất lượng dữ liệu",
  apiDocs: "API & tích hợp",
  tts: "Giọng đọc",
 },
 {
  locale: "en",
  personalGroup: "Personal",
  knowledgeGroup: "Capabilities",
  moreCluster: "More",
  dataQuality: "Data quality",
  apiDocs: "API & integrations",
  tts: "Text to speech",
 },
 {
  locale: "zh-CN",
  personalGroup: "个人",
  knowledgeGroup: "能力",
  moreCluster: "更多",
  dataQuality: "数据质量",
  apiDocs: "API 与集成",
  tts: "语音",
 },
] satisfies ReadonlyArray<{
 locale: AppLocale;
 personalGroup: string;
 knowledgeGroup: string;
 moreCluster: string;
 dataQuality: string;
 apiDocs: string;
 tts: string;
}>;

describe("Sidebar translations", () => {
 it.each(localeCases)(
  "renders configured navigation labels for $locale instead of message keys",
  async ({ locale, personalGroup, knowledgeGroup, moreCluster, dataQuality, apiDocs, tts }) => {
   const messages = await loadAppMessages(locale);
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <Sidebar canManageContent />
    </NextIntlClientProvider>,
   );

   expect(markup).toContain(personalGroup);
   expect(markup).toContain(knowledgeGroup);
   expect(markup).toContain(moreCluster);
   expect(markup).not.toContain(dataQuality);
   expect(markup).not.toContain(apiDocs);
   expect(markup).not.toContain(tts);
   expect(markup).not.toContain("Shell.navigation.");

   const destinationIds = filterNavigationGroupsForContentCapability(true).flatMap((group) =>
    group.sections.flatMap((section) => section.itemIds),
   );
   for (const itemId of destinationIds) {
    const href = navigationItems[itemId].href;
    expect(markup.split(`href="${href}"`)).toHaveLength(itemId === "home" ? 3 : 2);
   }
  },
 );

 it("keeps every learner route while hiding only the content-managed HTML route", async () => {
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <Sidebar canManageContent={false} />
   </NextIntlClientProvider>,
  );
  const destinationIds = filterNavigationGroupsForContentCapability(false).flatMap((group) =>
   group.sections.flatMap((section) => section.itemIds),
  );

  expect(destinationIds).not.toContain("htmlArtifacts");
  expect(markup).not.toContain(messages.Shell.navigation.items.htmlArtifacts);
  for (const itemId of destinationIds) {
   const href = navigationItems[itemId].href;
   expect(markup.split(`href="${href}"`)).toHaveLength(itemId === "home" ? 3 : 2);
  }
 });

 it("activates only Hán thương mại on its static HSK route", async () => {
  currentPathname = "/hsk/han-thuong-mai";
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <Sidebar canManageContent={false} />
   </NextIntlClientProvider>,
  );
  const activeLinks = markup.match(/<a[^>]*aria-current="page"[^>]*>/g) ?? [];

  expect(activeLinks).toHaveLength(1);
  expect(activeLinks[0]).toContain('href="/hsk/han-thuong-mai"');
  expect(activeLinks[0]).not.toContain('href="/hsk"');
  currentPathname = "/reader";
 });
});
