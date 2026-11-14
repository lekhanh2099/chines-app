import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import readerMessages from "../../../../messages/vi/reader.json";
import studioSeed from "@/features/hanzihome/static-json/studio-seed.json";
import { readerDocumentRowSchema } from "@/features/reading/model/reading-resource.schemas";
import { ReaderWorkspace } from "@/features/reading/workspaces/ReaderWorkspace";
import { resolveReadingDocumentHref } from "../navigation/reading-route-registry";
import type { ReaderDocumentRow } from "../model/reading-resource.schemas";

vi.mock("next/navigation", () => ({
 useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
 usePathname: () => "/reader",
 useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/reading/pdf/PdfReaderWorkspace", () => ({
 PdfReaderWorkspace: () => null,
}));

vi.mock("@/features/reading/workspaces/ReaderDocumentStudy", () => ({
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
 it.each([
  { kind: "core", href: "/reader/course/hsk-sample" },
  { kind: "hsk", href: "/hsk/sample" },
  { kind: "reinforcement", href: "/reader/practice/hsk-sample" },
  { kind: "mock", href: "/reader/mock/hsk-sample" },
  { kind: "daily", href: "/daily-reading" },
  { kind: "personal", href: "/personal-learning/hsk-sample" },
  { kind: "humanities", href: "/humanities?document=source%3A1" },
 ] satisfies Array<{ kind: ReaderDocumentRow["kind"]; href: string }>)(
  "resolves $kind with the canonical route owner",
  ({ kind, href }) => {
   const source = coreDocuments[0];
   if (!source) throw new Error("Missing core source");
   expect(resolveReadingDocumentHref({ ...source, kind, id: "source:1", slug: "hsk-sample" })).toBe(
    href,
   );
  },
 );
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
