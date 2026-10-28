import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { OptionSelectProps } from "@/components/ui/forms/option-select";
import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";

const { mockOptionSelect } = vi.hoisted(() => ({
 mockOptionSelect: vi.fn<(props: OptionSelectProps) => void>(),
}));

vi.mock("@/components/ui/forms/option-select", () => ({
 OptionSelect: (props: OptionSelectProps) => {
  mockOptionSelect(props);
  return <span />;
 },
}));

import { FilterSelect } from "./FilterSelect";

describe("FilterSelect", () => {
 it.each([
  { locale: "vi", all: "Tất cả" },
  { locale: "en", all: "All" },
  { locale: "zh-CN", all: "全部" },
 ] satisfies ReadonlyArray<{ locale: AppLocale; all: string }>)(
  "maps the empty aggregate filter to a localized select item for $locale",
  async ({ locale, all }) => {
   mockOptionSelect.mockClear();
   const messages = await loadAppMessages(locale);
   const onChange = vi.fn<(value: string) => void>();

   renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <FilterSelect
      label="Course"
      value=""
      options={[{ value: "course-1", label: "Course 1" }]}
      onChange={onChange}
     />
    </NextIntlClientProvider>,
   );

   expect(mockOptionSelect).toHaveBeenCalledWith(
    expect.objectContaining({
     value: "__all__",
     options: [
      { value: "__all__", label: all },
      { value: "course-1", label: "Course 1" },
     ],
    }),
   );

   const optionSelectProps = mockOptionSelect.mock.calls[0]?.[0];
   if (!optionSelectProps) throw new Error("FilterSelect did not render OptionSelect.");

   optionSelectProps.onValueChange("__all__");
   expect(onChange).toHaveBeenCalledWith("");
  },
 );
});
