import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";

let canEdit = false;

vi.mock("@/features/hanzihome/hooks/useHanziHomeCanEdit", () => ({
 useHanziHomeCanEdit: () => canEdit,
}));

vi.mock("@/features/hanzihome/context/selectors", () => ({
 useHanziHomeFeatureSelector: () => "debug",
}));

vi.mock("@/features/hanzihome/context/actions", () => ({
 useHanziHomeFeatureActions: () => ({ setViewMode: vi.fn() }),
}));

vi.mock("@/features/hanzihome/context/workspaceLayout", () => ({
 developerToolsEnabled: true,
}));

import { HanziHomeDeveloperToolsSheetContent } from "./HanziHomeDeveloperTools";

describe("HanziHomeDeveloperToolsSheetContent", () => {
 beforeEach(() => {
  canEdit = false;
 });

 it("keeps learner workspace controls but hides technical choices without content permission", async () => {
  const messages = await loadAppMessages("vi");
  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <HanziHomeDeveloperToolsSheetContent splitEnabled={false} onToggleSplit={() => {}} />
   </NextIntlClientProvider>,
  );

  expect(html).toContain("Chia đôi màn hình");
  expect(html).not.toContain("Kiểm tra dữ liệu");
 });

 it("shows the data audit view choice to an authorized developer", async () => {
  const messages = await loadAppMessages("vi");
  canEdit = true;
  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <HanziHomeDeveloperToolsSheetContent splitEnabled={false} onToggleSplit={() => {}} />
   </NextIntlClientProvider>,
  );

  expect(html).toContain("Chia đôi màn hình");
  expect(html).toContain("Kiểm tra dữ liệu");
 });

 it.each([
  { locale: "en", split: "Split screen", audit: "Data audit" },
  { locale: "zh-CN", split: "分屏", audit: "数据检查" },
 ] satisfies ReadonlyArray<{ locale: AppLocale; split: string; audit: string }>)(
  "renders workspace chrome in $locale",
  async ({ locale, split, audit }) => {
   const messages = await loadAppMessages(locale);
   canEdit = true;
   const html = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <HanziHomeDeveloperToolsSheetContent splitEnabled={false} onToggleSplit={() => {}} />
    </NextIntlClientProvider>,
   );

   expect(html).toContain(split);
   expect(html).toContain(audit);
   expect(html).not.toContain("Shell.studyModules");
  },
 );
});
