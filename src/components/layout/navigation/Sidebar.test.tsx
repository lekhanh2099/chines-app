import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import { sidebarStore } from "@/stores/shell/sidebar-store";

import { AppLogoMark } from "./AppLogoMark";
import { GlyphHPlain, GlyphHRoof } from "./brand-glyph";
import { BrandWordmark } from "./BrandWordmark";
import { filterNavigationGroupsForContentCapability, navigationItems } from "./navigation-config";
import { MobileBottomNavigation, Sidebar } from "./Sidebar";

vi.mock("next/navigation", () => ({
 useSearchParams: () => currentSearchParams,
}));

let currentPathname = "/reader";
let currentSearchParams = new URLSearchParams();

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
 usePathname: () => currentPathname,
}));

const localeCases = [
 {
  locale: "vi",
  personalGroup: "Cá nhân",
  knowledgeGroup: "Năng lực",
  moreCluster: "Thêm",
  chineseBridge: "Nhịp cầu Hán ngữ",
  readingComprehension: "Đọc hiểu",
  spokenChinese: "Khẩu ngữ Trung cấp 1",
  dataQuality: "Chất lượng dữ liệu",
  apiDocs: "API & tích hợp",
  tts: "Giọng đọc",
 },
 {
  locale: "en",
  personalGroup: "Personal",
  knowledgeGroup: "Capabilities",
  moreCluster: "More",
  chineseBridge: "Chinese Bridge",
  readingComprehension: "Reading comprehension",
  spokenChinese: "Intermediate Spoken Chinese 1",
  dataQuality: "Data quality",
  apiDocs: "API & integrations",
  tts: "Text to speech",
 },
 {
  locale: "zh-CN",
  personalGroup: "个人",
  knowledgeGroup: "能力",
  moreCluster: "更多",
  chineseBridge: "桥梁",
  readingComprehension: "阅读理解",
  spokenChinese: "中级汉语口语 1",
  dataQuality: "数据质量",
  apiDocs: "API 与集成",
  tts: "语音",
 },
] satisfies ReadonlyArray<{
 locale: AppLocale;
 personalGroup: string;
 knowledgeGroup: string;
 moreCluster: string;
 chineseBridge: string;
 readingComprehension: string;
 spokenChinese: string;
 dataQuality: string;
 apiDocs: string;
 tts: string;
}>;

describe("Sidebar translations", () => {
 afterEach(() => {
  sidebarStore.actions.setCollapsed(false);
  currentPathname = "/reader";
  currentSearchParams = new URLSearchParams();
 });

 it.each(localeCases)(
  "renders configured navigation labels for $locale instead of message keys",
  async ({
   locale,
   personalGroup,
   knowledgeGroup,
   moreCluster,
   chineseBridge,
   readingComprehension,
   spokenChinese,
   dataQuality,
   apiDocs,
   tts,
  }) => {
   const messages = await loadAppMessages(locale);
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <Sidebar canManageContent />
    </NextIntlClientProvider>,
   );

   expect(markup).toContain(personalGroup);
   expect(markup).toContain(knowledgeGroup);
   expect(markup).toContain(moreCluster);
   expect(markup).toContain('viewBox="-2 0 40 40"');
   expect(markup).toContain('aria-label="HanziHome"');
   expect(markup).not.toContain('class="brand-mark');
   expect(markup).toContain('id="sidebar-section-textbooks"');
   expect(markup).toContain(messages.Shell.navigation.sections.textbooks);
   expect(markup).toContain(chineseBridge);
   expect(markup).not.toContain(readingComprehension);
   expect(markup).toContain(spokenChinese);
   expect(markup).not.toContain(dataQuality);
   expect(markup).not.toContain(apiDocs);
   expect(markup).not.toContain(tts);
   expect(markup).not.toContain("Shell.navigation.");

   for (const group of filterNavigationGroupsForContentCapability(true)) {
    const firstItem = group.sections.flatMap((section) => section.itemIds)[0];
    if (firstItem === undefined) throw new Error(`Empty navigation group: ${group.id}`);
    currentPathname = navigationItems[firstItem].href;
    const groupMarkup = renderToStaticMarkup(
     <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
      <Sidebar canManageContent />
     </NextIntlClientProvider>,
    );
    expect(groupMarkup).toMatch(
     new RegExp(
      `<button(?=[^>]*aria-expanded="true")(?=[^>]*aria-controls="sidebar-group-${group.id}")`,
     ),
    );
    expect(groupMarkup).toContain(`id="sidebar-group-${group.id}"`);
    for (const section of group.sections) {
     if (section.collapsible) {
      expect(groupMarkup).toContain(`aria-controls="sidebar-section-${section.id}"`);
      expect(groupMarkup).toContain(`id="sidebar-section-${section.id}"`);
     }
     for (const itemId of section.itemIds) {
      const href = navigationItems[itemId].href;
      expect(groupMarkup.split(`href="${href}"`)).toHaveLength(itemId === "home" ? 3 : 2);
     }
    }
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
  const groups = filterNavigationGroupsForContentCapability(false);
  const destinationIds = groups.flatMap((group) =>
   group.sections.flatMap((section) => section.itemIds),
  );

  expect(destinationIds).not.toContain("htmlArtifacts");
  expect(markup).not.toContain(messages.Shell.navigation.items.htmlArtifacts);
  for (const group of groups) {
   const firstItem = group.sections.flatMap((section) => section.itemIds)[0];
   if (firstItem === undefined) throw new Error(`Empty navigation group: ${group.id}`);
   currentPathname = navigationItems[firstItem].href;
   const groupMarkup = renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <Sidebar canManageContent={false} />
    </NextIntlClientProvider>,
   );
   expect(groupMarkup).not.toContain(messages.Shell.navigation.items.htmlArtifacts);
   for (const section of group.sections) {
    for (const itemId of section.itemIds) {
     const href = navigationItems[itemId].href;
     expect(groupMarkup.split(`href="${href}"`)).toHaveLength(itemId === "home" ? 3 : 2);
    }
   }
  }
 });

 it("keeps a named home link and the expand toggle in the collapsed rail", async () => {
  sidebarStore.actions.setCollapsed(true);
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <Sidebar canManageContent={false} />
   </NextIntlClientProvider>,
  );

  expect(markup).toContain('href="/" aria-label="HanziHome"');
  expect(markup).toContain('class="size-10 rounded-xl flex');
  expect(markup).not.toContain('viewBox="-2 0 40 40"');
  expect(markup).not.toContain(">LK</div>");
  expect(markup).toContain(
   `aria-label="Mở ${messages.Shell.navigation.sidebarLabel.toLowerCase()}"`,
  );
 });

 it.each(["/hsk/han-thuong-mai", "/hsk/nhip-cau-han-ngu", "/hsk/doc-hieu", "/hsk/khau-ngu-tc1"])(
  "activates one matching textbook or lesson library link on %s",
  async (pathname) => {
   currentPathname = pathname;
   const messages = await loadAppMessages("vi");
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <Sidebar canManageContent={false} />
    </NextIntlClientProvider>,
   );
   const activeLinks = markup.match(/<a[^>]*aria-current="page"[^>]*>/g) ?? [];
   const textbookSection = markup.match(/<div id="sidebar-section-textbooks"[^>]*>/)?.[0] ?? "";

   expect(activeLinks).toHaveLength(1);
   expect(activeLinks[0]).toContain(
    `href="${pathname === "/hsk/doc-hieu" ? "/hanzihome" : pathname}"`,
   );
   expect(activeLinks[0]).not.toContain('href="/hsk"');
   expect(markup).toContain('aria-controls="sidebar-section-textbooks"');
   expect(markup).toMatch(
    /<div id="sidebar-section-textbooks"[^>]*><div class="[^"]*border-l[^"]*border-border-default/,
   );
   expect(textbookSection.includes("hidden")).toBe(pathname === "/hsk/doc-hieu");
   currentPathname = "/reader";
  },
 );

 it.each(["/hsk/han-thuong-mai", "/hsk/nhip-cau-han-ngu", "/hsk/doc-hieu", "/hsk/khau-ngu-tc1"])(
  "keeps the mobile lesson entry active for %s",
  async (pathname) => {
   currentPathname = pathname;
   const messages = await loadAppMessages("vi");
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <MobileBottomNavigation canManageContent={false} />
    </NextIntlClientProvider>,
   );
   const activeLinks = markup.match(/<a[^>]*aria-current="page"[^>]*>/g) ?? [];

   expect(activeLinks).toHaveLength(1);
   expect(activeLinks[0]).toContain('href="/hanzihome"');
   currentPathname = "/reader";
  },
 );

 it("keeps the lesson library active inside a catalog lesson workspace", async () => {
  currentPathname = "/hanzihome";
  currentSearchParams = new URLSearchParams("courseId=hanyu&bookId=book-1&lesson=2&module=grammar");
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <Sidebar canManageContent={false} />
   </NextIntlClientProvider>,
  );
  const activeLinks = markup.match(/<a[^>]*aria-current="page"[^>]*>/g) ?? [];

  expect(activeLinks).toHaveLength(1);
  expect(activeLinks[0]).toContain('href="/hanzihome"');
  currentPathname = "/reader";
  currentSearchParams = new URLSearchParams();
 });

 it.each(["/hsk", "/hsk/grammar"])("preserves the HSK selection on %s", async (pathname) => {
  currentPathname = pathname;
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <Sidebar canManageContent={false} />
   </NextIntlClientProvider>,
  );
  const activeLinks = markup.match(/<a[^>]*aria-current="page"[^>]*>/g) ?? [];

  expect(activeLinks).toHaveLength(1);
  expect(activeLinks[0]).toContain(`href="${pathname}"`);
  currentPathname = "/reader";
 });

 it("shows a floating active leaf and unfilled group triggers without a profile dock", async () => {
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <Sidebar canManageContent={false} />
   </NextIntlClientProvider>,
  );
  const activeLink = markup.match(/<a(?=[^>]*aria-current="page")[^>]*>.*?<\/a>/)?.[0] ?? "";

  expect(markup).toMatch(
   /<button(?=[^>]*data-variant="navigation")(?=[^>]*aria-controls="sidebar-group-learning")/,
  );
  expect(markup).toMatch(
   /<button(?=[^>]*data-variant="navigation")(?=[^>]*aria-controls="sidebar-section-hsk-reading")/,
  );
  expect(activeLink).toContain('href="/reader"');
  expect(activeLink).toContain("h-9");
  expect(activeLink).toContain("min-h-9");
  expect(activeLink).not.toContain("min-h-12");
  expect(activeLink).toContain("bg-surface");
  expect(activeLink).toContain("border-border-default");
  expect(activeLink).toContain("shadow-xs");
  expect(activeLink).toMatch(/class="[^"]*size-1\.5 rounded-full bg-primary/);
  expect(markup).toContain("bg-surface-subtle/40");
  expect(markup).not.toContain("Lê Khánh");
  expect(markup).not.toContain("HSK 4");
  expect(markup).not.toContain("5 ngày");
 });
});

describe("HanziHome brand", () => {
 it("gives the wordmark a named home link with the two specified glyphs", () => {
  const markup = renderToStaticMarkup(<BrandWordmark />);

  expect(markup).toContain('href="/"');
  expect(markup).toContain('aria-label="HanziHome"');
  expect(markup.match(/class="brand-roof"/g)).toHaveLength(1);
  expect(markup.match(/class="brand-bar"/g)).toHaveLength(2);
  expect(markup).toContain("anzi");
  expect(markup).toContain("ome");
 });

 it.each([<BrandWordmark key="wordmark" />, <AppLogoMark key="mark" />])(
  "renders theme-driven inline strokes without a static image or hardcoded colors",
  (brand) => {
   const markup = renderToStaticMarkup(brand);

   expect(markup).toContain("<svg");
   expect(markup).toContain('stroke="var(--theme-accent, var(--accent))"');
   expect(markup).not.toContain("<img");
   expect(markup).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  },
 );

 it("preserves the approved geometry, theme strokes and caller classes for both glyphs", () => {
  const plain = renderToStaticMarkup(<GlyphHPlain className="sample" />);
  const roof = renderToStaticMarkup(<GlyphHRoof className="sample" />);

  expect(plain).toContain('viewBox="-2 0 40 40"');
  expect(plain).toContain('class="sample"');
  expect(plain).not.toContain("brand-roof");
  expect(roof).toContain('viewBox="-4 -18 44 58"');
  expect(roof).toContain('d="M-0.5 -4.5 L18 -15.5 L36.5 -4.5"');
  expect(roof).toContain('stroke="var(--theme-primary, var(--primary))"');
  expect(roof).toContain('class="brand-roof"');
  expect(plain).toContain('width="8.5"');
  expect(roof).toContain('stroke-width="6.5"');
 });
});
