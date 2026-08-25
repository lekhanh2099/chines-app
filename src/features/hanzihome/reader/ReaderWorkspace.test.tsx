import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import readerMessages from "../../../../messages/vi/reader.json";
import studioSeed from "../static-json/studio-seed.json";
import { readerDocumentRowSchema } from "./reader.schemas";
import { ReaderWorkspace } from "./ReaderWorkspace";

vi.mock("next/navigation", () => ({
 useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
 usePathname: () => "/reader",
 useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("./PdfReaderWorkspace", () => ({
 PdfReaderWorkspace: () => null,
}));

vi.mock("./ReaderDocumentStudy", () => ({
 ReaderDocumentStudy: () => null,
}));

const coreDocuments = readerDocumentRowSchema
 .array()
 .parse(studioSeed.reader.documents)
 .filter((document) => document.kind === "core");

function renderReaderWorkspace({
 resumeDocument = null,
 resumeHref = "",
 resumeUnavailable = false,
}: {
 resumeDocument?: (typeof coreDocuments)[number] | null;
 resumeHref?: string;
 resumeUnavailable?: boolean;
}) {
 return renderToStaticMarkup(
  <NextIntlClientProvider
   locale="vi"
   messages={{ Reader: readerMessages }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   <ReaderWorkspace
    initialDocuments={coreDocuments}
    initialResource={null}
    initialPdfAssets={[]}
    initialResumeDocument={resumeDocument}
    initialResumeHref={resumeHref}
    initialResumeUnavailable={resumeUnavailable}
   />
  </NextIntlClientProvider>,
 );
}

describe("ReaderWorkspace", () => {
 it("renders the latest incomplete Reader document as the continue action", () => {
  const resumeDocument = coreDocuments[0];
  if (resumeDocument === undefined) {
   throw new Error("Expected the static Reader corpus to include core documents.");
  }
  const resumeHref = `/reader/course/${resumeDocument.slug}`;
  const markup = renderReaderWorkspace({ resumeDocument, resumeHref });

  expect(markup).toContain("Học tiếp");
  expect(markup).toContain(resumeDocument.title_zh);
  expect(markup).toContain(`href="${resumeHref}"`);
 });

 it("does not leave a loading placeholder when there is no Reader progress", () => {
  const markup = renderReaderWorkspace({});

  expect(markup).not.toContain("animate-pulse");
  expect(markup).not.toContain("Đang tải hoạt động học");
  expect(markup).toContain('href="/hsk"');
  expect(markup).not.toContain('href="/reader/hsk"');
 });

 it("renders an explicit error state when Reader progress is unavailable", () => {
  const markup = renderReaderWorkspace({ resumeUnavailable: true });

  expect(markup).toContain("Không tải được trạng thái học tiếp");
  expect(markup).not.toContain("animate-pulse");
 });
});
