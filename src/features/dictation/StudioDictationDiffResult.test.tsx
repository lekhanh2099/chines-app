import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import dictationMessages from "../../../messages/vi/dictation.json";
import {
 buildDictationDiff,
 summarizeDictationDiff,
} from "@/features/hanzihome/practice/dictation-comparison";
import { externalDictationEntry } from "./dictation-workspace-utils";
import { StudioDictationDiffResult } from "./StudioDictationDiffResult";

describe("StudioDictationDiffResult", () => {
 it("preserves diff token markup and summary badges via DictationDiffView", () => {
  const entry = externalDictationEntry("line-1", "早上好我是佳佳", "Line 1");
  const diff = buildDictationDiff("早上好我是佳佳", "早上我叫佳佳呀");
  const summary = summarizeDictationDiff(diff);

  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" timeZone="UTC" messages={{ Dictation: dictationMessages }}>
    <StudioDictationDiffResult entry={entry} diff={diff} summary={summary} />
   </NextIntlClientProvider>,
  );

  expect(html).toContain('lang="zh-CN"');
  expect(html).toContain("text-success-text");
  expect(html).toContain("text-warning-text line-through opacity-75");
  expect(html).toContain("(好)");
  expect(html).toContain("text-danger-text");
  expect(html).toContain('data-slot="badge"');
  expect(html).toContain("Đúng 5");
  expect(html).toContain("Thiếu 1");
  expect(html).toContain("Thay 1");
  expect(html).toContain("Thừa 1");
 });

 it("omits summary badges when summary is null", () => {
  const entry = externalDictationEntry("line-2", "你好", "Line 2");
  const diff = buildDictationDiff("你好", "你好");

  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" timeZone="UTC" messages={{ Dictation: dictationMessages }}>
    <StudioDictationDiffResult entry={entry} diff={diff} summary={null} />
   </NextIntlClientProvider>,
  );

  expect(html).toContain("text-success-text");
  expect(html).not.toContain('data-slot="badge"');
 });
});
