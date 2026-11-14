import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";

let canEdit = false;
let editMode = false;

vi.mock("@/features/hanzihome/hooks/useHanziHomeCanEdit", () => ({
 useHanziHomeCanEdit: () => canEdit,
}));

vi.mock("@/features/hanzihome/context/selectors", () => ({
 useHanziHomeEditMode: () => editMode,
 useHanziHomeFeatureSelector: () => "debug",
}));

vi.mock("@/features/hanzihome/context/actions", () => ({
 useHanziHomeFeatureActions: () => ({ setViewMode: vi.fn() }),
}));

vi.mock("@/features/hanzihome/context/workspaceLayout", () => ({
 contentEditingEnabled: true,
 developerToolsEnabled: true,
}));

vi.mock("@/features/hanzihome/editing", () => ({
 HanziHomeEditingTools: () => <span>Edit tools</span>,
 HanziHomeEditingDialogShell: () => null,
}));

import { HanziHomeDeveloperToolsSheetContent } from "./HanziHomeDeveloperTools";

describe("HanziHomeDeveloperToolsSheetContent", () => {
 beforeEach(() => {
  canEdit = false;
  editMode = false;
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
  expect(html).not.toContain("Edit tools");
 });

 it("keeps technical choices hidden until an authorized editor enables edit mode", async () => {
  const messages = await loadAppMessages("vi");
  canEdit = true;
  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <HanziHomeDeveloperToolsSheetContent splitEnabled={false} onToggleSplit={() => {}} />
   </NextIntlClientProvider>,
  );

  expect(html).not.toContain("Kiểm tra dữ liệu");
  expect(html).toContain("Edit tools");

  editMode = true;
  const editingHtml = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <HanziHomeDeveloperToolsSheetContent splitEnabled={false} onToggleSplit={() => {}} />
   </NextIntlClientProvider>,
  );
  expect(editingHtml).toContain("Kiểm tra dữ liệu");
 });

 it.each([
  { locale: "en", split: "Split screen", audit: "Data audit" },
  { locale: "zh-CN", split: "分屏", audit: "数据检查" },
 ] satisfies ReadonlyArray<{ locale: AppLocale; split: string; audit: string }>)(
  "renders workspace chrome in $locale",
  async ({ locale, split, audit }) => {
   const messages = await loadAppMessages(locale);
   canEdit = true;
   editMode = true;
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
