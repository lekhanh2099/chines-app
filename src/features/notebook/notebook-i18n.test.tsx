import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NotebookEmptyState } from "@/features/notebook/components/NotebookEmptyState";
import { NotebookDeepDive } from "@/features/notebook/components/NotebookDeepDive";
import { NotebookMatrixView } from "@/features/notebook/components/NotebookMatrixView";
import { NotebookSectionGuide } from "@/features/notebook/components/NotebookSectionGuide";
import { NotebookTermCard } from "@/features/notebook/components/NotebookTermCard";
import {
 getNotebookSectionItems,
 notebookSeedData,
} from "@/features/notebook/data/notebookSeedData";
import { getNotebookDeepDive } from "@/features/notebook/data/notebookDeepDiveData";
import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";

const localeCases = [
 { locale: "vi", empty: "Không tìm thấy mục phù hợp", term: "Từ", avoid: "Tránh" },
 { locale: "en", empty: "No matching items", term: "Term", avoid: "Avoid" },
 { locale: "zh-CN", empty: "没有匹配的项目", term: "词语", avoid: "避免" },
] satisfies ReadonlyArray<{
 locale: AppLocale;
 empty: string;
 term: string;
 avoid: string;
}>;

describe("Notebook messages", () => {
 it.each(localeCases)(
  "renders localized empty and matrix chrome for $locale",
  async (testCase) => {
   const messages = await loadAppMessages(testCase.locale);
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider
     locale={testCase.locale}
     messages={messages}
     timeZone="Asia/Ho_Chi_Minh"
    >
     <NotebookEmptyState />
     <NotebookMatrixView items={[]} />
    </NextIntlClientProvider>,
   );

   expect(markup).toContain(testCase.empty);
   expect(markup).toContain(testCase.term);
   expect(markup).toContain(testCase.avoid);
   expect(markup).not.toContain("Notebook.");
  },
  10_000,
 );

 it("keeps Notebook guidance and term details inside one major surface", async () => {
  const messages = await loadAppMessages("vi");
  const item = getNotebookSectionItems("conjunctions")[0];
  if (!item) throw new Error("Expected the conjunction Notebook fixture to contain a term");

  const guideMarkup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <NotebookSectionGuide section={notebookSeedData.conjunctions} />
   </NextIntlClientProvider>,
  );
  const termMarkup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <NotebookTermCard item={item} />
   </NextIntlClientProvider>,
  );
  const deepDiveMarkup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <NotebookDeepDive deepDive={getNotebookDeepDive(item)} />
   </NextIntlClientProvider>,
  );

  expect((guideMarkup.match(/data-slot="card"/g) ?? []).length).toBe(1);
  expect((termMarkup.match(/data-slot="card"/g) ?? []).length).toBe(1);
  expect(deepDiveMarkup).not.toContain("w-[92%]");
  expect(deepDiveMarkup).not.toContain("border-purple");
  expect(deepDiveMarkup).not.toContain("bg-purple");
 });
});
